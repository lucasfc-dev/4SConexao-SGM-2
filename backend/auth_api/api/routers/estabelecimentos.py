from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi import Request, UploadFile, File, Form
from api.models import Estabelecimento, Pacote, User
from api.schemas import (
    EstabelecimentoIn,
    EstabelecimentoOut,
    UpdatedEstabelecimento,
    EstabelecimentoWithUsers,
    UserOut,
    ServerEstabelecimentoOut,
    EstabelecimentoPublicData
)
from api.security import encrypt_password
from api.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException
)
from api.services.webhooks import acervo_webhooks
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List, Optional
from io import BytesIO

router = APIRouter(prefix='/estabelecimento', tags=['estabelecimento'])


@router.post('/{id}/acervo/reconciliar/')
async def reconciliar_acervo(request: Request, id: UUID):
    """Reenvia o estado completo (órgãos + usuários) ao acervo_api. Idempotente.
    Serve para backfill de estabs antigos e correção de drift. Admin só no próprio
    estab; superuser em qualquer um."""
    current_user = await request.state.user
    if not (current_user.is_super or current_user.is_admin):
        raise ForbiddenException('Apenas administradores.')
    try:
        estabelecimento = await Estabelecimento.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Id de estabelecimento não existe')

    if not current_user.is_super and current_user.estabelecimento_id != id:
        raise ForbiddenException('Apenas administradores deste estabelecimento.')

    if not await acervo_webhooks.estab_tem_acervo(estabelecimento):
        raise BadRequestException('Estabelecimento não possui a funcionalidade Acervo Digital.')

    await acervo_webhooks.acervo_ativado(estabelecimento, current_user.id)
    return {'message': 'Reconciliação disparada'}

@router.post('/', response_model=EstabelecimentoOut)
async def criar_estabelecimento(request: Request, estabelecimento: EstabelecimentoIn):
    current_user = request.state.user
    if current_user.is_super:
        async with in_transaction("default") as connection:
            try:
                pacote = await Pacote.create(nome=f"Pacote de {estabelecimento.nome}", using_db=connection)
                estabelecimento_criado = await Estabelecimento.create(
                        nome=estabelecimento.nome, pacote=pacote, cidade=estabelecimento.cidade,
                        responsavel=estabelecimento.responsavel, using_db=connection
                    )
                return estabelecimento_criado
            except DoesNotExist:
                await connection.rollback()
                raise NotFoundException('Não foi possível criar Estabelecimento, Id do pacote não existe')
    raise UnauthorizedException("Sem premissões")
    



@router.get('/all/', response_model=List[EstabelecimentoOut])
async def get_all_estabelecimento(request: Request):
    current_user = await request.state.user
    if current_user.is_super:
        estabelecimetos = await Estabelecimento.all()
        return estabelecimetos
    raise UnauthorizedException('Não autorizado')



@router.get('/all/users/', response_model=List[EstabelecimentoWithUsers])
async def get_estabelecimento_users(request: Request):
    current_user = await request.state.user
    if current_user.is_super:
        estabelecimentos = await Estabelecimento.all()
        response = [
            EstabelecimentoWithUsers(
                estabelecimento=EstabelecimentoOut.model_validate(estabelecimento),
                users=[
                    UserOut.model_validate({
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "nome": user.nome,
                        "created_at": user.created_at,
                        "cpf": user.cpf,
                        "is_admin": user.is_admin,
                        "is_super": user.is_super,
                    }) for user in await estabelecimento.users.all().select_related('estabelecimento')
                ]
            )
            for estabelecimento in estabelecimentos
        ]
        return response
    raise ForbiddenException('Não autorizado')


@router.get('/{id}/',response_model=ServerEstabelecimentoOut)
async def get_user_estabelecimento(request:Request,id:UUID):
    try:
        estabelecimento = await Estabelecimento.get(id=id)
        return ServerEstabelecimentoOut.model_validate(estabelecimento)
    except DoesNotExist:
        raise NotFoundException('Id de estabelecimento não existe')

@router.get('/public/{estabelecimento_id}/basic-data/', response_model=EstabelecimentoPublicData)
async def get_estabelecimento_public_data(
    estabelecimento_id: UUID,
):  
    try:
        estabelecimento = await Estabelecimento.get(id=estabelecimento_id)
        return EstabelecimentoPublicData.to_model(estabelecimento)
    except DoesNotExist:
        raise NotFoundException("Estabelecimento não encontrado")

@router.get('/{id}/cert_file/')
async def get_cert(request:Request,id:UUID):
    # Otimização: carregar apenas campo 'certificado' necessário
    estabelecimento = await Estabelecimento.get(id=id).only('certificado', 'nome')
    
    from api.utils.files import iterfile, get_download_headers
    
    headers = get_download_headers(
        filename=f"certificado_{estabelecimento.nome}.p12",
        content_length=len(estabelecimento.certificado),
        disposition='attachment',
        cache_max_age=0  # Não cachear certificados
    )
    
    return StreamingResponse(
        iterfile(estabelecimento.certificado),
        media_type='application/pkcs12',
        headers=headers
    )

@router.get('/{id}/cert_password/')
async def get_cert_password(request: Request, id: UUID):
    estabelecimento = await Estabelecimento.get(id=id)
    cert_pass = estabelecimento.senha_cert
    return {"senha_cert": cert_pass}
    
@router.get('/{id}/nome/')
async def get_nome(request: Request, id: UUID):
    estabelecimento = await Estabelecimento.get(id=id)
    return {"nome": estabelecimento.nome}

@router.patch('/{id}/',response_model=ServerEstabelecimentoOut)
async def update_estabelecimento(
    request:Request,id:UUID,
    nome: Optional[str] = Form(None),
    cidade: Optional[str] = Form(None),
    responsavel: Optional[str] = Form(None),
    icone: Optional[UploadFile] = File(None),
    certificado: Optional[UploadFile] = File(None),
    senha_cert:Optional[str]=Form(None)):

    if icone and icone.content_type not in ["image/png", "image/jpeg"]:
        raise BadRequestException("Ícone deve ser uma imagem PNG ou JPEG.")
    if certificado and certificado.content_type not in ["application/x-pkcs12", "application/octet-stream","application/pkcs12"]:
        raise BadRequestException("Certificado deve ser um arquivo PFX (PKCS#12).")

    updated_estabelecimento = UpdatedEstabelecimento(
            nome=nome,
            cidade=cidade,
            responsavel=responsavel,
            icone= await icone.read() if icone is not None else None,
            certificado=await certificado.read() if certificado is not None else None,
            senha_cert=encrypt_password(senha_cert) if senha_cert is not None else None
        )
    try:
        current_user:User = await request.state.user
        estabelecimento:Estabelecimento = await current_user.estabelecimento
        if current_user.is_super:
            estabelecimento = await Estabelecimento.get(id=id)
        await estabelecimento.update_from_dict(updated_estabelecimento.model_dump(exclude_none=True)).save()
        estabelecimento_pydantic = ServerEstabelecimentoOut.model_validate(estabelecimento)
        return estabelecimento_pydantic 
    except Exception as e:
        raise InternalServerErrorException(f'{e}')
 
@router.patch('/{id}/config/',response_model=ServerEstabelecimentoOut)
async def atualizar_config(request:Request,id:UUID,updated_estabelecimento:UpdatedEstabelecimento):
    try:
        new_config = updated_estabelecimento.config
        if new_config:
            estabelecimento = await Estabelecimento.get(id=id)
            # Converte o schema validado para dict, removendo Nones
            config_dict = new_config.model_dump(exclude_none=True)
            estabelecimento.config.update(config_dict)
            await estabelecimento.save()
            return ServerEstabelecimentoOut.model_validate(estabelecimento)
        raise BadRequestException('Configuração de estabelecimento vazia')
    except DoesNotExist:
        raise NotFoundException('Id de estabelecimento não existe')
    except Exception as e:
        raise InternalServerErrorException(f'{type(e).__name__}: {e}')

@router.get("/icone/{id}/")
async def get_uploaded_file(id: UUID):
    try:
        estabelecimento = await Estabelecimento.get(id=id)
        if estabelecimento.icone is not None:
            icone_buffer = BytesIO(estabelecimento.icone)
            return StreamingResponse(icone_buffer) 
        else:
            return JSONResponse('Icone do Estabelecimento encontrado',status_code=404)
    except DoesNotExist:
        raise NotFoundException('Id do estabelecimento não existe')
    except Exception as e:
        raise InternalServerErrorException('Não foi possível executar o processo')

@router.delete('/{id}/')
async def delete_estabelecimento(request:Request,id:UUID):
    current_user = request.state.user
    if current_user.is_super:
        try:    
            estabelecimento = await Estabelecimento.get(id=id)
            await estabelecimento.delete()
            return JSONResponse('Estabelecimento deletado')
        except DoesNotExist:
            raise NotFoundException('Não foi possível criar Estabelecimento, Id do pacote não existe')
        except Exception as e:
            raise InternalServerErrorException('Não foi possível deletar o estabelecimento')
    raise UnauthorizedException("Sem premissões")