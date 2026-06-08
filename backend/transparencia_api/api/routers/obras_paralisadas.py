from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import ObrasParalisadas
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/obras_paralisadas",
    tags=["Obras Paralisadas"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{obra_id}/arquivo/")
async def obter_arquivo_obra_paralisada(request: Request, obra_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        obra = await ObrasParalisadas.get(id=obra_id).only('arquivo', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{obra.titulo.strip()}.pdf",
            content_length=len(obra.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(obra.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{obra_id}/detalhes/")
async def obter_obra_paralisada(request: Request, obra_id: UUID = Path(...)):
    try:
        obra = await ObrasParalisadas.get(id=obra_id)
        return obra.to_dict()
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_obras_paralisadas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    titulo: Optional[str] = Query(None),
    responsavel: Optional[str] = Query(None),
    data_paralisacao__gte: Optional[date] = Query(None),
    data_paralisacao__lte: Optional[date] = Query(None),
    data_previsao_retorno__gte: Optional[date] = Query(None),
    data_previsao_retorno__lte: Optional[date] = Query(None),
):
    try:
        query = ObrasParalisadas.filter(estabelecimento=estabelecimento_id)
        if titulo:
            query = query.filter(titulo__icontains=titulo)
        if responsavel:
            query = query.filter(responsavel__icontains=responsavel)
        if data_paralisacao__gte:
            query = query.filter(data_paralisacao__gte=data_paralisacao__gte)
        if data_paralisacao__lte:
            query = query.filter(data_paralisacao__lte=data_paralisacao__lte)
        if data_previsao_retorno__gte:
            query = query.filter(data_previsao_retorno__gte=data_previsao_retorno__gte)
        if data_previsao_retorno__lte:
            query = query.filter(data_previsao_retorno__lte=data_previsao_retorno__lte)

        obras = await query.only(
            'titulo', 'objeto_obra', 'data_paralisacao', 'data_previsao_retorno',
            'responsavel', 'justificativa'
        )

        rows = [
            {
                "Titulo": o.titulo,
                "Objeto Obra": o.objeto_obra,
                "Data Paralisacao": o.data_paralisacao,
                "Data Previsao Retorno": o.data_previsao_retorno,
                "Responsavel": o.responsavel,
                "Justificativa": o.justificativa,
            }
            for o in obras
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"obras_paralisadas_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{estabelecimento_id}/")
async def listar_obras_paralisadas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    titulo: Optional[str] = Query(None),
    responsavel: Optional[str] = Query(None),
    data_paralisacao__gte: Optional[date] = Query(None),
    data_paralisacao__lte: Optional[date] = Query(None),
    data_previsao_retorno__gte: Optional[date] = Query(None),
    data_previsao_retorno__lte: Optional[date] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = ObrasParalisadas.filter(estabelecimento=estabelecimento_id)
        if titulo:
            query = query.filter(titulo__icontains=titulo)
        if responsavel:
            query = query.filter(responsavel__icontains=responsavel)
        if data_paralisacao__gte:
            query = query.filter(data_paralisacao__gte=data_paralisacao__gte)
        if data_paralisacao__lte:
            query = query.filter(data_paralisacao__lte=data_paralisacao__lte)
        if data_previsao_retorno__gte:
            query = query.filter(data_previsao_retorno__gte=data_previsao_retorno__gte)
        if data_previsao_retorno__lte:
            query = query.filter(data_previsao_retorno__lte=data_previsao_retorno__lte)
        total = await query.count()
        obras = await query.offset(offset).limit(limit)
        data = [o.to_dict() for o in obras]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_obra_paralisada(
    request: Request,
    titulo: Optional[str] = Form(None),
    objeto_obra: Optional[str] = Form(None),
    data_paralisacao: Optional[date] = Form(None),
    responsavel: Optional[str] = Form(None),
    justificativa: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_previsao_retorno: Optional[date] = Form(None),
):
    try:
        client = request.state.client
        obra = await ObrasParalisadas.create(
            titulo=titulo,
            objeto_obra=objeto_obra,
            data_paralisacao=data_paralisacao,
            data_previsao_retorno=data_previsao_retorno,
            responsavel=responsavel,
            justificativa=justificativa,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return obra.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{obra_id}/")
async def atualizar_obra_paralisada(
    request: Request,
    obra_id: UUID = Path(...),
    titulo: Optional[str] = Form(None),
    objeto_obra: Optional[str] = Form(None),
    data_paralisacao: Optional[date] = Form(None),
    responsavel: Optional[str] = Form(None),
    justificativa: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_previsao_retorno: Optional[date] = Form(None),
):
    try:
        obra = await ObrasParalisadas.get(id=obra_id)
        
        if titulo is not None:
            obra.titulo = titulo
        if objeto_obra is not None:
            obra.objeto_obra = objeto_obra
        if data_paralisacao is not None:
            obra.data_paralisacao = data_paralisacao
        if data_previsao_retorno is not None:
            obra.data_previsao_retorno = data_previsao_retorno
        if responsavel is not None:
            obra.responsavel = responsavel
        if justificativa is not None:
            obra.justificativa = justificativa
        if file is not None:
            obra.arquivo = await file.read()
        
        await obra.save()
        return obra.to_dict()
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{obra_id}/")
async def deletar_obra_paralisada(
    request: Request,
    obra_id: UUID = Path(...)
):
    try:
        obra = await ObrasParalisadas.get(id=obra_id)
        await obra.delete()
        return {"message": "Obra deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))  