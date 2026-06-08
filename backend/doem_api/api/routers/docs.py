from __future__ import annotations
from fastapi.routing import APIRouter
from fastapi import UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from api.models import Document
from api.schemas import DocumentOut, UserOut
from api.exceptions import (
    BadRequestException,
    NotFoundException,
    InternalServerErrorException
)
import os, base64
from typing import List
from tortoise.exceptions import DoesNotExist
from uuid import UUID
import os
import subprocess
import tempfile
from io import BytesIO

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

router = APIRouter(prefix='/docs',tags=['docs'])

def convert_doc_to_docx(doc_data):
    with tempfile.TemporaryDirectory() as tmpdirname:
        doc_path = os.path.join(tmpdirname, 'temp.doc')
        docx_path = os.path.join(tmpdirname, 'temp.docx')

        with open(doc_path, 'wb') as doc_file:
            doc_file.write(doc_data)

        command = [
            'soffice',
            '--headless',
            '--convert-to',
            'docx',
            '--outdir',
            tmpdirname,
            doc_path
        ]

        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if result.returncode != 0:
            error_message = result.stderr.decode()
            raise Exception(f"Erro na conversão com LibreOffice: {error_message}")

        if not os.path.exists(docx_path):
            raise FileNotFoundError(f"Arquivo convertido não encontrado: {docx_path}")

        with open(docx_path, 'rb') as docx_file:
            docx_data = docx_file.read()

        return docx_data

@router.post("/uploadfile/", status_code=200, response_model=DocumentOut)
async def upload_file(request: Request, titulo: str = Form(...), file: UploadFile = File(...), orgao_id: UUID = Form(...), tipo: str = Form(...), force_scan: bool = Form(False)):
    tipos_permitidos = [
        "Lei", "Portaria", "Contrato", "Aviso", "Extrato", "Termo", "Edital", "Decreto", "Resolucao", "Ato", "Imagem"
    ]
    if tipo not in tipos_permitidos:
        raise BadRequestException(f"Tipo de documento '{tipo}' não é permitido. Tipos permitidos: {tipos_permitidos}")
    try:
        client:AuthClient = request.state.client
        current_user = client.user.model
        data = await file.read()
        filename = file.filename
        if file.content_type == 'application/msword':
            data = convert_doc_to_docx(data)
            tipo_mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            filename = os.path.splitext(file.filename)[0] + '.docx'
        elif file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            tipo_mime = file.content_type
            filename = file.filename
        elif file.content_type == 'application/pdf':
            tipo_mime = 'application/pdf'
            filename = file.filename
        else:
            raise BadRequestException("Tipo de arquivo não suportado")

        document = await Document.create(
            titulo=titulo,
            filename=filename,
            data=data,
            sender=current_user.id,
            orgao=orgao_id,
            tipo=tipo,
            force_scan=force_scan,
            estabelecimento=current_user.estabelecimento.id
        )
        return document
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao salvar o arquivo: {str(e)}")


@router.get('/download/{doc_id}/', status_code=200)
async def get_document_content(doc_id: str):
    try:
        # Otimização: carregar apenas campos necessários
        document = await Document.get(id=doc_id).only('data', 'filename')
        
        from api.utils.files import iterfile, get_download_headers
        
        # Determinar media type baseado na extensão
        if document.filename.endswith(".pdf"):
            media_type = 'application/pdf'
        elif document.filename.endswith(".docx"):
            media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            media_type = 'application/octet-stream'
        
        headers = get_download_headers(
            filename=document.filename,
            content_length=len(document.data)
        )
        
        return StreamingResponse(
            iterfile(document.data),
            media_type=media_type,
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('ID de documento não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Não foi possivel processar o arquivo: {e}')

@router.get('/user/all/', status_code=202, response_model=List[DocumentOut])
async def get_all_user_documents(request: Request):
    try:
        client: AuthClient = request.state.client
        documents = await Document.filter(sender=client.user.id)
        return documents
    except DoesNotExist:
        raise NotFoundException('Não foi encontrado documentos desse usuário')
    
@router.get('/all/', status_code=202, response_model=List[DocumentOut])
async def get_all_user_estab_documents(request: Request):
    try:
        client: AuthClient = request.state.client
        documents = await Document.filter(estabelecimento=client.estabelecimento.id)
        return documents
    except Exception as e:
        raise InternalServerErrorException(f'Não foi possivel carregar os arquivos: {e}')

@router.delete('/{id}/')
async def delete_document(request: Request, id: UUID):
    try:
        document = await Document.get(id=id)
        document_id = document.id
        await document.delete()
        return {'message': f'Documento de id {document_id} deletado com sucesso'}
    except DoesNotExist:
        raise NotFoundException('ID de documento não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Não foi possivel processar o arquivo: {e}')