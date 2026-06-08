from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import PublicacaoSimples, CategoriaPublicacao
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/publicacao_simples",
    tags=["Publicação Simples"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{publicacao_id}/arquivo/")
async def obter_arquivo_publicacao_simples(request: Request, publicacao_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        publicacao = await PublicacaoSimples.get(id=publicacao_id).only('arquivo', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{publicacao.titulo.strip()}.pdf",
            content_length=len(publicacao.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(publicacao.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Publicação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/{categoria}/exportar/")
async def exportar_publicacoes_simples(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    categoria: CategoriaPublicacao = Path(...),
    type: str = Query("csv"),
    titulo: Optional[str] = Query(None),
    descricao: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
):
    try:
        query = PublicacaoSimples.filter(estabelecimento=estabelecimento_id, categoria=categoria)
        if titulo:
            query = query.filter(titulo__icontains=titulo)
        if descricao:
            query = query.filter(descricao__icontains=descricao)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)

        publicacoes = await query.only(
            'titulo', 'descricao', 'categoria', 'data_publicacao'
        )

        rows = [
            {
                "Titulo": p.titulo,
                "Descricao": p.descricao,
                "Categoria": p.categoria,
                "Data Publicacao": p.data_publicacao,
            }
            for p in publicacoes
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"publicacao_simples_{categoria}_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{estabelecimento_id}/{categoria}/")
async def listar_publicacoes_simples(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    titulo: Optional[str] = Query(None),
    descricao: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    categoria: CategoriaPublicacao = Path(...),

    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = PublicacaoSimples.filter(estabelecimento=estabelecimento_id, categoria=categoria)
        if titulo:
            query = query.filter(titulo=titulo)
        if descricao:
            query = query.filter(descricao=descricao)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        
        total = await query.count()
        publicacoes = await query.offset(offset).limit(limit)
        data = [p.to_dict() for p in publicacoes]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{publicacao_id}/")
async def obter_publicacao_simples(request: Request, publicacao_id: UUID = Path(...)):
    try:
        publicacao = await PublicacaoSimples.get(id=publicacao_id)
        return publicacao.to_dict()
    except DoesNotExist:
        raise NotFoundException("Publicação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/{categoria}/")
async def criar_publicacao_simples(
    request: Request,
    categoria: CategoriaPublicacao = Path(...),
    data_publicacao: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
    titulo: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
):
    try:
        client = request.state.client
        publicacao = await PublicacaoSimples.create(
            categoria=categoria,
            data_publicacao=data_publicacao,
            arquivo=await file.read() if file else None,
            titulo=titulo,
            descricao=descricao,
            estabelecimento=client.estabelecimento.id
        )
        return publicacao.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{publicacao_id}/")
async def atualizar_publicacao_simples(
    request: Request,
    publicacao_id: UUID = Path(...),
    data_publicacao: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
    titulo: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None)
):
    try:
        publicacao = await PublicacaoSimples.get(id=publicacao_id)
        
        if data_publicacao is not None:
            publicacao.data_publicacao = data_publicacao
        if titulo is not None:
            publicacao.titulo = titulo
        if descricao is not None:
            publicacao.descricao = descricao
        if file is not None:
            publicacao.arquivo = await file.read()
        
        await publicacao.save()
        return publicacao.to_dict()
    except DoesNotExist:
        raise NotFoundException("Publicação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{publicacao_id}/")
async def deletar_publicacao_simples(
    request: Request,
    publicacao_id: UUID = Path(...)
):
    try:
        publicacao = await PublicacaoSimples.get(id=publicacao_id)
        await publicacao.delete()
        return {"message": "Publicação deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Publicação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))