from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import DocumentoNumerado, CategoriaDocumentoNumerado
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/doc_numerado",
    tags=["Documento Numerado"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{documento_id}/arquivo/")
async def obter_arquivo_documento_numerado(request: Request, documento_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        documento = await DocumentoNumerado.get(id=documento_id).only('arquivo', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{documento.titulo.strip()}.pdf",
            content_length=len(documento.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(documento.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Documento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/{categoria}/exportar/")
async def exportar_documentos_numerados(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    categoria: CategoriaDocumentoNumerado = Path(...),
    type: str = Query("csv"),
    numero: Optional[str] = Query(None),
    titulo: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
):
    try:
        query = DocumentoNumerado.filter(estabelecimento=estabelecimento_id, categoria=categoria)
        if numero:
            query = query.filter(num_doc__icontains=numero)
        if titulo:
            query = query.filter(titulo__icontains=titulo)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)

        documentos = await query.only(
            'titulo', 'descricao', 'categoria', 'num_doc', 'data_publicacao'
        )

        rows = [
            {
                "Numero": d.num_doc,
                "Titulo": d.titulo,
                "Descricao": d.descricao,
                "Categoria": d.categoria,
                "Data Publicacao": d.data_publicacao,
            }
            for d in documentos
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"doc_numerado_{categoria}_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rota com 2 parâmetros de path
@router.get("/{estabelecimento_id}/{categoria}/")
async def listar_documentos_numerados(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    categoria: CategoriaDocumentoNumerado = Path(...),
    numero: Optional[str] = Query(None),    
    titulo: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = DocumentoNumerado.filter(estabelecimento=estabelecimento_id, categoria=categoria)
        if numero:
            query = query.filter(num_doc__icontains=numero)
        if titulo:
            query = query.filter(titulo__icontains=titulo)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        total = await query.count()
        documentos = await query.offset(offset).limit(limit)
        data = [d.to_dict() for d in documentos]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{documento_id}/")
async def obter_documento_numerado(request: Request, documento_id: UUID = Path(...)):
    try:
        documento = await DocumentoNumerado.get(id=documento_id)
        return documento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Documento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/{categoria}/")
async def criar_documento_numerado(
    request: Request,
    categoria: CategoriaDocumentoNumerado = Path(...),
    data_publicacao: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
    titulo: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    num_doc: Optional[str] = Form(None),
):
    try:
        client = request.state.client
        documento = await DocumentoNumerado.create(
            categoria=categoria,
            data_publicacao=data_publicacao,
            arquivo=await file.read() if file else None,
            titulo=titulo,
            descricao=descricao,
            num_doc=num_doc,
            estabelecimento=client.estabelecimento.id
        )
        return documento.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{documento_id}/")
async def atualizar_documento_numerado(
    request: Request,
    documento_id: UUID = Path(...),
    data_publicacao: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
    titulo: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    num_doc: Optional[str] = Form(None)
):
    try:
        documento = await DocumentoNumerado.get(id=documento_id)
        
        if data_publicacao is not None:
            documento.data_publicacao = data_publicacao
        if titulo is not None:
            documento.titulo = titulo
        if descricao is not None:
            documento.descricao = descricao
        if num_doc is not None:
            documento.num_doc = num_doc
        if file is not None:
            documento.arquivo = await file.read()
        
        await documento.save()
        return documento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Documento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{documento_id}/")
async def deletar_documento_numerado(
    request: Request,
    documento_id: UUID = Path(...)
):
    try:
        documento = await DocumentoNumerado.get(id=documento_id)
        await documento.delete()
        return {"message": "Documento deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Documento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
