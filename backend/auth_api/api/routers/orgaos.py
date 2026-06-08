from fastapi.routing import APIRouter
from fastapi import Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from api.schemas import OrgaoIn, OrgaoOut, UpdatedOrgao
from api.models import Orgao, Estabelecimento
from api.exceptions import (
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    InternalServerErrorException
)
from api.services.webhooks import acervo_webhooks
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List
from io import BytesIO

router = APIRouter(prefix='/orgao', tags=['orgaos'])

@router.post('/', response_model=OrgaoOut)
async def create_orgao(request: Request, o: OrgaoIn):
    current_user = await request.state.user
    if current_user.is_admin == False:
        raise UnauthorizedException("Sem permissões para criar orgão")
    try:
        estabelecimento = await Estabelecimento.get(id=o.estabelecimento_id)
        orgao = await Orgao.create(
            nome=o.nome,
            cnpj=o.cnpj,
            endereco=o.endereco,
            estabelecimento=estabelecimento,
            poder=o.poder,
            is_estabelecimento=o.is_estabelecimento
        )
        await orgao.fetch_related('estabelecimento')
        if await acervo_webhooks.estab_tem_acervo(estabelecimento):
            await acervo_webhooks.orgao_criado(estabelecimento, orgao, current_user.id)
        return orgao
    except DoesNotExist:
        raise NotFoundException('Id de estabelecimento não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')

@router.post('/{orgao_id}/icone/')
async def upload_icone(
    request: Request,
    orgao_id: UUID,
    icone: UploadFile = File(...)
):
    current_user = await request.state.user
    if not current_user.is_admin:
        raise UnauthorizedException("Sem permissões para atualizar ícone")
    try:
        orgao = await Orgao.get(id=orgao_id)
        orgao.icone = await icone.read()
        await orgao.save()
        return {"detail": "Ícone atualizado com sucesso"}
    except DoesNotExist:
        raise NotFoundException('Id de orgão não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')

@router.get('/{orgao_id}/icone/')
async def get_icone_orgao(request: Request, orgao_id: UUID):
    try:
        # Otimização: carregar apenas campo 'icone' necessário
        orgao = await Orgao.get(id=orgao_id).only('icone', 'nome')
        if not orgao.icone:
            raise NotFoundException("Orgão não possui ícone")
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"icone_{orgao.nome}.png",
            content_length=len(orgao.icone),
            cache_max_age=86400  # Cache de 24h para ícones
        )
        
        return StreamingResponse(
            iterfile(orgao.icone),
            media_type="image/png",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('Id de orgão não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')

@router.get('/all/estabelecimento/', response_model=List[OrgaoOut])
async def get_all_orgaos_estabelecimento(request: Request):
    current_user = await request.state.user
    estabelecimento = await current_user.estabelecimento
    orgaos = await estabelecimento.orgaos.all().prefetch_related('estabelecimento')
    return orgaos

    
@router.get('/{id}/', response_model=OrgaoOut)
async def get_orgao(request: Request, id: UUID):
    try:
        orgao = await Orgao.get(id=id)
        await orgao.fetch_related('estabelecimento')
        return orgao
    except DoesNotExist:
        raise NotFoundException('Id de orgão não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')
    
@router.delete('/{id}/', status_code=200, response_model=OrgaoOut)
async def delete_orgao(request: Request, id: UUID):
    current_user = await request.state.user  
    if current_user.is_admin or current_user.is_super:
        orgao = await Orgao.get(id=id).prefetch_related('estabelecimento')
        await orgao.delete()
        return orgao
    else:
        raise ForbiddenException('Not enough permissions')

@router.get('/', response_model=List[OrgaoOut])
async def get_orgao_estabelecimento(request: Request):
    current_user = await request.state.user
    estabelecimento = await current_user.estabelecimento
    orgaos = await estabelecimento.orgaos.all().prefetch_related('estabelecimento')
    return orgaos

@router.patch('/{orgao_id}/', response_model=OrgaoOut)
async def update_orgao(request: Request, orgao_id: UUID, updated_orgao: UpdatedOrgao):
    current_user = await request.state.user
    estabelecimento = await current_user.estabelecimento
    try:
        orgao = await Orgao.get(id=orgao_id)
        orgao_estabelecimento = await orgao.estabelecimento
        if current_user.is_admin and estabelecimento == orgao_estabelecimento:
            await orgao.update_from_dict(updated_orgao.model_dump(exclude_none=True)).save()
            await orgao.fetch_related('estabelecimento')
            return orgao
        else:
            raise UnauthorizedException('Sem permissões')
    except DoesNotExist:
        raise NotFoundException('Id de documento não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Não foi possível atualizar orgão: {e}')
    

@router.get('/estabelecimento/{estabelecimento_id}/', response_model=List[OrgaoOut])
async def get_doc_by_estabelecimento(estabelecimento_id: UUID):
    orgaos = await Orgao.filter(estabelecimento=estabelecimento_id).prefetch_related('estabelecimento')
    return orgaos