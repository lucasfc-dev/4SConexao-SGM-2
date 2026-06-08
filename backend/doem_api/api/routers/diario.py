from __future__ import annotations
from fastapi.routing import APIRouter
from fastapi import Query, Form, File, UploadFile, Request
from fastapi.responses import JSONResponse, StreamingResponse
from api.models import Document, DiarioOficial, Assinatura
from api.schemas import DiarioOut, DiarioIn, UpdatedDiario, DocumentOut, EmailIn, EmailOut, AttachmentSchema
from api.config import EMAIL_API_URL, NEXT_FRONTEND_URL
from api.services.pdf.pdf_service import PDFService
from api.exceptions import (
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
    ForbiddenException,
    CertificateExpiredException,
    InvalidCertificatePasswordException
)
from typing import List
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from babel.dates import format_date
from datetime import datetime, date
from pytz import timezone
import requests
from io import BytesIO
import logging
import secrets
from typing import TYPE_CHECKING, Union
if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

router = APIRouter(prefix='/diario',tags=['diario_oficial'])

# Configuração de logging
logger = logging.getLogger(__name__)

# O PDFService agora será criado com AuthClient em cada endpoint

# Caracteres alfanuméricos sem ambiguidades (remove O, 0, I, 1, L)
CARACTERES_SEGUROS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
LETRAS_SEGURAS = 'ABCDEFGHJKMNPQRSTUVWXYZ'
NUMEROS_SEGUROS = '23456789'

async def gerar_codigo_referencia() -> str:
    """Gera um código de referência alfanumérico de 6 caracteres único
    
    Regras de validação:
    - Deve ter pelo menos 3 dígitos numéricos (2-9)
    - Usa apenas caracteres sem ambiguidade visual:
      * Letras: A-Z (exceto O, I, L)
      * Números: 2-9 (exceto 0, 1)
    - Usa secrets (criptograficamente seguro)
    
    Combinações possíveis: ~887 milhões
    """
    max_tentativas = 100
    
    for _ in range(max_tentativas):
        # Gera código aleatório de 6 caracteres usando secrets
        cod_ref = ''.join(secrets.choice(CARACTERES_SEGUROS) for _ in range(6))
        
        # Valida regra: pelo menos 3 dígitos
        qtd_digitos = sum(1 for c in cod_ref if c in NUMEROS_SEGUROS)
        if qtd_digitos < 3:
            continue  # Regenera se não tiver pelo menos 3 dígitos
        
        # Verifica se já existe no banco
        existe = await Assinatura.filter(cod_ref=cod_ref).exists()
        if not existe:
            return cod_ref
    
    # Fallback improvável: garante 3 números e 3 letras manualmente
    letras_part = ''.join(secrets.choice(LETRAS_SEGURAS) for _ in range(3))
    numeros_part = ''.join(secrets.choice(NUMEROS_SEGUROS) for _ in range(3))
    # Embaralha combinando as partes de forma aleatória
    cod_list = list(letras_part + numeros_part)
    for i in range(len(cod_list) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        cod_list[i], cod_list[j] = cod_list[j], cod_list[i]
    return ''.join(cod_list)

@router.post('/gerar_diario/',response_model=DiarioOut)
async def gerar_diario(request:Request,diarioIn:DiarioIn):
    try:
        client:AuthClient = request.state.client
        documents_models = [await Document.get(id=str(id)) for id in diarioIn.document_ids]
        estabelecimento = client.estabelecimento.model
        data_publicacao = diarioIn.date
        data_publicacao_full = format_date(data_publicacao, format='full', locale='pt_BR')
        data_str = estabelecimento.config.get('data_lei')
        data_obj = datetime.strptime(data_str, "%Y-%m-%d").date()
        data_lei = format_date(data_obj, format='long', locale='pt_BR').upper()
        edicao = await DiarioOficial.filter(estabelecimento=estabelecimento.id, is_published=True).count() + 1
        if estabelecimento.icone is None or estabelecimento.certificado is None:
            raise NotFoundException('Brasão ou Certificado nulos')
        
        # Usa o PDF service para gerar o PDF
        pdf_service = PDFService(auth_client=client)
        pdf_data = await pdf_service.generate_diario_pdf(
            documents_models, 
            data_publicacao_full, 
            data_lei, 
            edicao
        )
        data_publicacao_long = format_date(data_publicacao, format='long', locale='pt_BR')
        titulo = f'Edição n° de {data_publicacao_long}'
        diario = await DiarioOficial.create(
            titulo=titulo,
            data=pdf_data,
            estabelecimento=estabelecimento.id,
            published_at=data_publicacao,
            is_published=False
        )
        for document in documents_models:
            await diario.documents.add(document)
        await diario.save()
        return diario
    except DoesNotExist:
        raise NotFoundException('ID de documento não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro no servidor: {e}')
    

fuso_horario = timezone('America/Sao_Paulo')

@router.get('/sign/{id}/',response_model=DiarioOut)
async def assinar_diario(request:Request,id:UUID):
    """Assina digitalmente um diário oficial
    
    O PDFService gerencia todo o processo de assinatura, incluindo:
    - Validação do certificado digital
    - Adição de assinatura visual
    - Aplicação de assinatura digital
    """
    client:AuthClient = request.state.client
    estabelecimento = client.estabelecimento.model
    
    try:
        diario = await DiarioOficial.get(id=id)
        if diario.signed:
            raise BadRequestException('O Diário já foi assinado e publicado')
    except DoesNotExist:
        raise NotFoundException('ID de diário não encontrado')

    # Gera código de referência alfanumérico de 6 caracteres
    cod_ref = await gerar_codigo_referencia()

    pdf_service = PDFService(auth_client=client)
    url_qrcode = f'{NEXT_FRONTEND_URL}/validar_diario/{cod_ref}'
    diario_assinatura_data = await pdf_service.assinar_pdf(diario.data, cod_ref, url_qrcode=url_qrcode)
    await Assinatura.create(
        diario=diario,
        cod_ref=cod_ref,
        meta_data=diario_assinatura_data['dados_assinatura']
    )
    diario.data = diario_assinatura_data['pdf_data']
    diario.signed = True
    diario.is_published = True
    data_extenso = format_date(diario.published_at, format='long', locale='pt_BR')
    numero = estabelecimento.numero + await DiarioOficial.filter(estabelecimento=estabelecimento.id,is_published=True).count() + 1
    diario.titulo = f'Edição n°{numero} de {data_extenso}'
    await diario.save()
    return diario


@router.get('/all/',response_model=Union[List[DiarioOut],int])
async def get_all_diario(
    request:Request,
    is_published:bool,
    count:bool=False,
    limit:int=10,
    offset:int=0,
    titulo: str = Query(None),
    data_pub__gte: date = Query(None),
    data_pub__lte: date = Query(None)
    ):
    try:
        client:AuthClient = request.state.client
        filter_args = {
            'estabelecimento': client.estabelecimento.id,
            'is_published': is_published
        }
        extra = {
            'titulo__icontains': titulo,
            'published_at__gte': data_pub__gte,
            'published_at__lte': data_pub__lte,
        }
        filter_args.update({k: v for k, v in extra.items() if v})
        if count:
            return await DiarioOficial.filter(**filter_args).count()
        return await DiarioOficial.filter(**filter_args).order_by('-published_at').limit(limit).offset(offset)
    except Exception as e:
        raise InternalServerErrorException(f'Erro no servidor: {e}')
    

@router.get('/{id}/',response_model=DiarioOut) 
async def get_diario(request:Request,id:UUID):
    try:
        diario = await DiarioOficial.get(id=id)
        return diario
    except DoesNotExist:
        raise NotFoundException('ID de diário não encontrado')
    

@router.get('/{id}/content/')
async def get_diario_content(id:UUID):
    try:
        diario = await DiarioOficial.get(id=id).only('data')
        content_stream = BytesIO(bytes(diario.data))
        return StreamingResponse(
            content_stream,
            media_type="application/pdf",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    except DoesNotExist:
        raise NotFoundException('ID de diário não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro no servidor: {e}')

@router.get('/{id}/documentos/',response_model=List[DocumentOut])
async def get_docs_diario(request:Request,id:UUID):
    try:
        diario = await DiarioOficial.get(id=id)
        documents = await diario.documents.all()
        return documents
    except DoesNotExist:
        raise NotFoundException('ID de diário não encontrado')

@router.patch('/{id}/')
async def atualizar_diario(request:Request,id:UUID,updated_diario:UpdatedDiario):
    try:
        if updated_diario.document_ids:
            client:AuthClient = request.state.client
            estabelecimento = client.estabelecimento
            diario = await DiarioOficial.get(id=id)
            current_docs_models = await diario.documents.all()
            new_docs_models = [await Document.get(id=id) for id in updated_diario.document_ids]
            data_publicacao = format_date(diario.published_at, format='full', locale='pt_BR')
            config = estabelecimento.model.config
            data_str = config.get('data_lei')
            data_obj = datetime.strptime(data_str, "%Y-%m-%d").date()
            data_lei = format_date(data_obj, format='long', locale='pt_BR').upper()
            edicao = await DiarioOficial.filter(estabelecimento= estabelecimento.id,is_published=True).count() + 1
            
            # Usa o PDF service para gerar o PDF
            pdf_service = PDFService(auth_client=client)
            pdf_data = await pdf_service.generate_diario_pdf(
                new_docs_models, 
                data_publicacao, 
                data_lei, 
                edicao
            )
            if diario.is_published or diario.signed:
                # Re-assina com novo código de referência
                cod_ref = await gerar_codigo_referencia()
                url_qrcode = f'{NEXT_FRONTEND_URL}/validar_diario/{cod_ref}'
                diario_assinatura_data = await pdf_service.assinar_pdf(pdf_data, cod_ref, url_qrcode=url_qrcode)
                diario.data = diario_assinatura_data['pdf_data']
                diario.signed = True
                diario.is_published = True
                await Assinatura.filter(diario=diario).delete()
                await Assinatura.create(
                    diario=diario,
                    cod_ref=cod_ref,
                    meta_data=diario_assinatura_data['dados_assinatura']
                )
            else:
                diario.data = pdf_data
            docs_to_remove = list(set(current_docs_models) - set(new_docs_models))
            docs_to_add = list(set(new_docs_models) - set(current_docs_models))
            for doc in docs_to_add:
                await diario.documents.add(doc)
            for doc in docs_to_remove:
                await diario.documents.remove(doc)
            await diario.save()
            return JSONResponse('Diário atualizado com sucesso.',status_code=200)
        else:
            raise BadRequestException('Lista de IDs de Documentos vazia.')
    except DoesNotExist:
        raise NotFoundException('ID de diário não encontrado')

@router.delete('/{id}/')
async def delete_diario(request:Request,id:UUID):
    try:
        client:AuthClient = request.state.client
        user = client.user.model
        diario = await DiarioOficial.get(id=id)
        diario_id = diario.id
        if diario.is_published and not user.is_admin:
            raise ForbiddenException('Usuário sem permissões para deletar')  
        await diario.delete()
        return {'message':f'Diario de id {diario_id} deletado'}
    except DoesNotExist:
        raise NotFoundException('Id de Diario não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')   
    

@router.post('/share/{id}/')
async def share_diario(request:Request,id:UUID,email:EmailIn):
    try:
        client:AuthClient = request.state.client
        diario = await DiarioOficial.get(id=id)
        attachment = AttachmentSchema(file=diario.data,filename=diario.titulo)
        email_out = EmailOut(
            email=email.email_address,
            subject='Compartilhamento de Diário Oficial Eletrônico',
            keys={'sender':client.user.model.nome},
            attachment=attachment)
        response = requests.post(url=f'{EMAIL_API_URL}/email/share',json=email_out.model_dump())
        return response.json()
    except DoesNotExist:
        raise NotFoundException('Id de Diario não encontrado')

@router.post('/upload/', response_model=List[DiarioOut])
async def upload_diario(
    files: List[UploadFile] = File(...), 
    estabelecimento_id: UUID = Form(...)
):
    logger.info(f"Iniciando upload de {len(files)} arquivo(s) para estabelecimento {estabelecimento_id}")
    
    # Validações básicas
    if not files:
        raise BadRequestException('Nenhum arquivo foi enviado')
    
    # Limite de tamanho por arquivo (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    diarios = []
    
    for file in files:
        try:
            logger.info(f"Processando arquivo: {file.filename}")
            
            # Validação do nome do arquivo
            if not file.filename:
                raise BadRequestException('Nome do arquivo não pode estar vazio')
            
            # Validação do tipo de arquivo
            if not file.filename.lower().endswith('.pdf'):
                raise BadRequestException(f'Arquivo {file.filename} deve ser um PDF')
            
            # Lê o conteúdo do arquivo
            file_content = await file.read()
            
            # Validação do tamanho do arquivo
            if len(file_content) > MAX_FILE_SIZE:
                raise BadRequestException(f'Arquivo {file.filename} excede o tamanho máximo de 10MB')
            
            if len(file_content) == 0:
                raise BadRequestException(f'Arquivo {file.filename} está vazio')
            
            # Gera o título removendo a extensão
            titulo = file.filename.rsplit('.', 1)[0]  # Usa rsplit para lidar com múltiplos pontos
            
            # Cria o diário
            diario = await DiarioOficial.create(
                titulo=titulo,
                data=file_content,
                published_at=datetime.now(fuso_horario).date(),  # Converte para date 
                is_published=True,
                signed=True,
                estabelecimento=estabelecimento_id
            )
            diarios.append(diario)
            logger.info(f"Diário criado com sucesso: {diario.id}")
            
        except BadRequestException:
            # Re-lança exceções de validação
            logger.warning(f"Erro de validação no arquivo {file.filename}")
            raise
        except Exception as e:
            # Captura erros específicos no processamento do arquivo
            logger.error(f"Erro ao processar arquivo {file.filename}: {str(e)}")
            raise InternalServerErrorException(f'Erro ao processar arquivo {file.filename}: {str(e)}')
    
    if not diarios:
        raise BadRequestException('Nenhum diário foi criado com sucesso')
    
    logger.info(f"Upload concluído com sucesso. {len(diarios)} diário(s) criado(s)")
    return diarios
    
@router.get('/estabelecimento/{id}/',response_model=Union[List[DiarioOut],int])
async def get_diarios_estabelecimento(
    request:Request,
    id:UUID,
    is_published:bool,
    count:bool=False,
    limit:int=Query(None),
    offset:int=0,
    titulo: str = Query(None),
    data_inicial: date = Query(None),
    data_final: date = Query(None)
):
    try:
        filter_args = {
            'estabelecimento': id,
            'is_published': is_published
        }
        extra = {
            'titulo__icontains': titulo,
            'published_at__gte': data_inicial,
            'published_at__lte': data_final,
        }
        filter_args.update({k: v for k, v in extra.items() if v})
        if count:
            return await DiarioOficial.filter(**filter_args).count()
        if limit:
            return await DiarioOficial.filter(**filter_args).order_by('-published_at').limit(limit).offset(offset)
        return await DiarioOficial.filter(**filter_args).order_by('-published_at').offset(offset)
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')

@router.get('/valida/{cod_ref}/')
async def validar_diario_por_cod_ref(cod_ref: str):
    try:
        assinatura = await Assinatura.get(cod_ref=cod_ref)
        await assinatura.fetch_related('diario')
        diario = await assinatura.diario
        return {
            'diario_id': diario.id,
            'dados_assinatura': assinatura.meta_data,
        }
    except DoesNotExist:
        raise NotFoundException('Assinatura não existente')