from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import Obra, SituacaoObra
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from typing import Optional
from decimal import Decimal
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/obra",
    tags=["Obras"],
)

@router.get("/{obra_id}/arquivo/")
async def obter_arquivo_obra(request: Request, obra_id: UUID = Path(...)):
    try:
        obra = await Obra.get(id=obra_id).only('arquivo', 'empresa_contratada')
        if not obra.arquivo:
            raise NotFoundException("Obra não possui arquivo")
        from api.utils.files import iterfile, get_download_headers
        headers = get_download_headers(
            filename=f"{obra.empresa_contratada.strip()}.pdf",
            content_length=len(obra.arquivo),
            disposition='attachment'
        )
        return StreamingResponse(iterfile(obra.arquivo), media_type="application/pdf", headers=headers)
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{obra_id}/detalhes/")
async def obter_obra(request: Request, obra_id: UUID = Path(...)):
    try:
        obra = await Obra.get(id=obra_id)
        return obra.to_dict()
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_obras(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    empresa_contratada: Optional[str] = Query(None),
    situacao: Optional[SituacaoObra] = Query(None),
    data_inicio__gte: Optional[date] = Query(None),
    data_inicio__lte: Optional[date] = Query(None),
    data_conclusao__gte: Optional[date] = Query(None),
    data_conclusao__lte: Optional[date] = Query(None),
):
    try:
        query = Obra.filter(estabelecimento=estabelecimento_id)
        if empresa_contratada:
            query = query.filter(empresa_contratada__icontains=empresa_contratada)
        if situacao:
            query = query.filter(situacao=situacao)
        if data_inicio__gte:
            query = query.filter(data_inicio__gte=data_inicio__gte)
        if data_inicio__lte:
            query = query.filter(data_inicio__lte=data_inicio__lte)
        if data_conclusao__gte:
            query = query.filter(data_conclusao__gte=data_conclusao__gte)
        if data_conclusao__lte:
            query = query.filter(data_conclusao__lte=data_conclusao__lte)

        obras = await query.only(
            'objeto', 'situacao', 'data_inicio', 'data_conclusao',
            'empresa_contratada', 'percentual_concluido'
        )

        rows = [
            {
                "Objeto": o.objeto,
                "Situação": o.situacao,
                "Data Início": o.data_inicio,
                "Data Conclusão": o.data_conclusao,
                "Empresa Contratada": o.empresa_contratada,
                "Percentual Concluído": o.percentual_concluido,
            }
            for o in obras
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"obras_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/")
async def listar_obras(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    empresa_contratada: Optional[str] = Query(None),
    situacao: Optional[SituacaoObra] = Query(None),
    data_inicio__gte: Optional[date] = Query(None),
    data_inicio__lte: Optional[date] = Query(None),
    data_conclusao__gte: Optional[date] = Query(None),
    data_conclusao__lte: Optional[date] = Query(None),
    offset: int = Query(0), limit: int = Query(10),
):
    try:
        query = Obra.filter(estabelecimento=estabelecimento_id)
        if empresa_contratada:
            query = query.filter(empresa_contratada__icontains=empresa_contratada)
        if situacao:
            query = query.filter(situacao=situacao)
        if data_inicio__gte:
            query = query.filter(data_inicio__gte=data_inicio__gte)
        if data_inicio__lte:
            query = query.filter(data_inicio__lte=data_inicio__lte)
        if data_conclusao__gte:
            query = query.filter(data_conclusao__gte=data_conclusao__gte)
        if data_conclusao__lte:
            query = query.filter(data_conclusao__lte=data_conclusao__lte)
        total = await query.count()
        obras = await query.offset(offset).limit(limit)
        data = [o.to_dict() for o in obras]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))


@router.post("/")
async def criar_obra(
    request: Request,
    objeto: Optional[str] = Form(None),
    situacao: Optional[SituacaoObra] = Form(None),
    data_inicio: Optional[date] = Form(None),
    empresa_contratada: Optional[str] = Form(None),
    percentual_concluido: Optional[float] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_conclusao: Optional[date] = Form(None),
):
    try:
        client = request.state.client
        obra = await Obra.create(
            objeto=objeto,
            situacao=situacao,
            data_inicio=data_inicio,
            data_conclusao=data_conclusao,
            empresa_contratada=empresa_contratada,
            percentual_concluido=Decimal(str(percentual_concluido)) if percentual_concluido is not None else None,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return obra.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))


@router.patch("/{obra_id}/")
async def atualizar_obra(
    request: Request,
    obra_id: UUID = Path(...),
    objeto: Optional[str] = Form(None),
    situacao: Optional[SituacaoObra] = Form(None),
    data_inicio: Optional[date] = Form(None),
    data_conclusao: Optional[date] = Form(None),
    empresa_contratada: Optional[str] = Form(None),
    percentual_concluido: Optional[float] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        obra = await Obra.get(id=obra_id)
        if objeto is not None:
            obra.objeto = objeto
        if situacao is not None:
            obra.situacao = situacao
        if data_inicio is not None:
            obra.data_inicio = data_inicio
        if data_conclusao is not None:
            obra.data_conclusao = data_conclusao
        if empresa_contratada is not None:
            obra.empresa_contratada = empresa_contratada
        if percentual_concluido is not None:
            obra.percentual_concluido = Decimal(str(percentual_concluido))
        if file is not None:
            obra.arquivo = await file.read()
        await obra.save()
        return obra.to_dict()
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.delete("/{obra_id}/")
async def deletar_obra(request: Request, obra_id: UUID = Path(...)):
    try:
        obra = await Obra.get(id=obra_id)
        await obra.delete()
        return {"message": "Obra deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Obra não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))
