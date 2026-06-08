from fastapi import File, Form, UploadFile, HTTPException
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.models import Documento, Chamado
from tortoise.exceptions import DoesNotExist
from typing import Optional,List
from uuid import UUID
from io import BytesIO


router = APIRouter(prefix="/docs",tags=["Documentos"])

@router.post('/')
async def create_docs(
    chamado_id:UUID = Form(...),
    files:List[UploadFile] = File(...),
):
    try:
        docs = []
        chamado = await Chamado.get(id=chamado_id)
        for file in files:
            documento = await Documento.create(
                filename=file.filename,
                chamado=chamado,
                arquivo=await file.read(),
                tipo=file.content_type
            )
            docs.append(documento.to_dict())
        return {"documentos": docs}
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{documento_id}/content/")
async def get_documento_content(documento_id: UUID):
    try:
        # Otimização: carregar apenas campos necessários
        documento = await Documento.get(id=documento_id).only('arquivo', 'filename', 'tipo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=documento.filename,
            content_length=len(documento.arquivo)
        )
        
        return StreamingResponse(
            iterfile(documento.arquivo),
            media_type=documento.tipo,
            headers=headers
        )
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))