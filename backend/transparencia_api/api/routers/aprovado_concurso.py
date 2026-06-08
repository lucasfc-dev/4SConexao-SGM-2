from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import AprovadoConcurso, ConcursoPublico
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/aprovado_concurso",
    tags=["Aprovados em Concurso"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{aprovado_id}/arquivo/")
async def obter_arquivo_aprovado_concurso(request: Request, aprovado_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        aprovado = await AprovadoConcurso.get(id=aprovado_id).only('arquivo', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{aprovado.titulo.strip()}.pdf",
            content_length=len(aprovado.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(aprovado.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Aprovado não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{aprovado_id}/detalhes/")
async def obter_aprovado_concurso(request: Request, aprovado_id: UUID = Path(...)):
    try:
        aprovado = await AprovadoConcurso.get(id=aprovado_id)
        return aprovado.to_dict()
    except DoesNotExist:
        raise NotFoundException("Aprovado não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_aprovados_concurso(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    concurso_id: Optional[UUID] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    titulo: Optional[str] = Query(None),
):
    try:
        filtros: dict = {"estabelecimento": estabelecimento_id}
        if concurso_id:
            filtros["concurso"] = await ConcursoPublico.get(id=concurso_id)
        if data_publicacao__gte:
            filtros["data_publicacao__gte"] = data_publicacao__gte
        if data_publicacao__lte:
            filtros["data_publicacao__lte"] = data_publicacao__lte
        if titulo:
            filtros["titulo__icontains"] = titulo

        aprovados = await AprovadoConcurso.filter(**filtros).only(
            'titulo', 'descricao', 'concurso_id', 'data_publicacao'
        )

        rows = [
            {
                "Titulo": a.titulo,
                "Descricao": a.descricao,
                "Concurso ID": a.concurso_id,
                "Data Publicacao": a.data_publicacao,
            }
            for a in aprovados
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"aprovado_concurso_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{estabelecimento_id}/")
async def listar_aprovados_concurso(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    concurso_id: Optional[UUID] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None), 
    data_publicacao__lte: Optional[date] = Query(None),
    titulo: Optional[str] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        filtros:dict = {"estabelecimento": estabelecimento_id}
        if concurso_id:
            filtros["concurso"] = await ConcursoPublico.get(id=concurso_id)
        if data_publicacao__gte:
            filtros["data_publicacao__gte"] = data_publicacao__gte
        if data_publicacao__lte:
            filtros["data_publicacao__lte"] = data_publicacao__lte
        if titulo:
            filtros["titulo__icontains"] = titulo
        query = AprovadoConcurso.filter(**filtros)
        total = await query.count()
        aprovados = await query.offset(offset).limit(limit)
        data = [a.to_dict() for a in aprovados]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_aprovado_concurso(
    request: Request,
    concurso_id: Optional[UUID] = Form(None),
    data_publicacao: Optional[date] = Form(None),
    titulo: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    descricao: Optional[str] = Form(None),
):
    try:
        client = request.state.client
        aprovado = await AprovadoConcurso.create(
            concurso_id=concurso_id,
            data_publicacao=data_publicacao,
            titulo=titulo,
            descricao=descricao,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return aprovado.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{aprovado_id}/")
async def atualizar_aprovado_concurso(
    request: Request,
    aprovado_id: UUID = Path(...),
    concurso_id: Optional[UUID] = Form(None),
    data_publicacao: Optional[date] = Form(None),
    titulo: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    descricao: Optional[str] = Form(None),
):
    try:
        aprovado = await AprovadoConcurso.get(id=aprovado_id)
        
        if concurso_id is not None:
            aprovado.concurso_id = concurso_id
        if data_publicacao is not None:
            aprovado.data_publicacao = data_publicacao
        if titulo is not None:
            aprovado.titulo = titulo
        if descricao is not None:
            aprovado.descricao = descricao
        if file is not None:
            aprovado.arquivo = await file.read()
        
        await aprovado.save()
        return aprovado.to_dict()
    except DoesNotExist:
        raise NotFoundException("Aprovado não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{aprovado_id}/")
async def deletar_aprovado_concurso(
    request: Request,
    aprovado_id: UUID = Path(...)
):
    try:
        aprovado = await AprovadoConcurso.get(id=aprovado_id)
        await aprovado.delete()
        return {"message": "Aprovado deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Aprovado não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
