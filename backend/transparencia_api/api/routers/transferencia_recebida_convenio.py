from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import TransferenciaRecebidaConvenio
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from typing import Optional
from decimal import Decimal
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/transferencia_recebida_convenio",
    tags=["Transferência Recebida Convênio"],
)

@router.get("/{convenio_id}/arquivo/")
async def obter_arquivo_transferencia_recebida(request: Request, convenio_id: UUID = Path(...)):
    try:
        convenio = await TransferenciaRecebidaConvenio.get(id=convenio_id).only('arquivo', 'numero_convenio', 'ano_convenio')
        from api.utils.files import iterfile, get_download_headers
        headers = get_download_headers(
            filename=f"convenio_{convenio.numero_convenio}_{convenio.ano_convenio}.pdf",
            content_length=len(convenio.arquivo),
            disposition='attachment'
        )
        return StreamingResponse(iterfile(convenio.arquivo), media_type="application/pdf", headers=headers)
    except DoesNotExist:
        raise NotFoundException("Convênio não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{convenio_id}/detalhes/")
async def obter_transferencia_recebida(request: Request, convenio_id: UUID = Path(...)):
    try:
        convenio = await TransferenciaRecebidaConvenio.get(id=convenio_id)
        return convenio.to_dict()
    except DoesNotExist:
        raise NotFoundException("Convênio não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_transferencias_recebidas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    orgao_repassador: Optional[str] = Query(None),
    numero_convenio: Optional[str] = Query(None),
    ano_convenio: Optional[int] = Query(None),
    data_inicio_vigencia__gte: Optional[date] = Query(None),
    data_inicio_vigencia__lte: Optional[date] = Query(None),
    data_fim_vigencia__gte: Optional[date] = Query(None),
    data_fim_vigencia__lte: Optional[date] = Query(None),
):
    try:
        query = TransferenciaRecebidaConvenio.filter(estabelecimento=estabelecimento_id)
        if orgao_repassador:
            query = query.filter(orgao_repassador__icontains=orgao_repassador)
        if numero_convenio:
            query = query.filter(numero_convenio__icontains=numero_convenio)
        if ano_convenio:
            query = query.filter(ano_convenio=ano_convenio)
        if data_inicio_vigencia__gte:
            query = query.filter(data_inicio_vigencia__gte=data_inicio_vigencia__gte)
        if data_inicio_vigencia__lte:
            query = query.filter(data_inicio_vigencia__lte=data_inicio_vigencia__lte)
        if data_fim_vigencia__gte:
            query = query.filter(data_fim_vigencia__gte=data_fim_vigencia__gte)
        if data_fim_vigencia__lte:
            query = query.filter(data_fim_vigencia__lte=data_fim_vigencia__lte)

        convenios = await query.only(
            'orgao_repassador', 'numero_convenio', 'ano_convenio', 'objeto',
            'valor_total', 'valor_repassado', 'data_inicio_vigencia', 'data_fim_vigencia'
        )

        rows = [
            {
                "Órgão Repassador": c.orgao_repassador,
                "Número Convênio": c.numero_convenio,
                "Ano": c.ano_convenio,
                "Objeto": c.objeto,
                "Valor Total": c.valor_total,
                "Valor Repassado": c.valor_repassado,
                "Início Vigência": c.data_inicio_vigencia,
                "Fim Vigência": c.data_fim_vigencia,
            }
            for c in convenios
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"transferencia_recebida_convenio_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/")
async def listar_transferencias_recebidas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    orgao_repassador: Optional[str] = Query(None),
    numero_convenio: Optional[str] = Query(None),
    ano_convenio: Optional[int] = Query(None),
    data_inicio_vigencia__gte: Optional[date] = Query(None),
    data_inicio_vigencia__lte: Optional[date] = Query(None),
    data_fim_vigencia__gte: Optional[date] = Query(None),
    data_fim_vigencia__lte: Optional[date] = Query(None),
    offset: int = Query(0), limit: int = Query(10),
):
    try:
        query = TransferenciaRecebidaConvenio.filter(estabelecimento=estabelecimento_id)
        if orgao_repassador:
            query = query.filter(orgao_repassador__icontains=orgao_repassador)
        if numero_convenio:
            query = query.filter(numero_convenio__icontains=numero_convenio)
        if ano_convenio:
            query = query.filter(ano_convenio=ano_convenio)
        if data_inicio_vigencia__gte:
            query = query.filter(data_inicio_vigencia__gte=data_inicio_vigencia__gte)
        if data_inicio_vigencia__lte:
            query = query.filter(data_inicio_vigencia__lte=data_inicio_vigencia__lte)
        if data_fim_vigencia__gte:
            query = query.filter(data_fim_vigencia__gte=data_fim_vigencia__gte)
        if data_fim_vigencia__lte:
            query = query.filter(data_fim_vigencia__lte=data_fim_vigencia__lte)
        total = await query.count()
        convenios = await query.offset(offset).limit(limit)
        data = [c.to_dict() for c in convenios]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))


@router.post("/")
async def criar_transferencia_recebida(
    request: Request,
    orgao_repassador: Optional[str] = Form(None),
    numero_convenio: Optional[str] = Form(None),
    ano_convenio: Optional[int] = Form(None),
    objeto: Optional[str] = Form(None),
    valor_total: Optional[float] = Form(None),
    valor_repassado: Optional[float] = Form(None),
    data_inicio_vigencia: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_fim_vigencia: Optional[date] = Form(None),
):
    try:
        client = request.state.client
        convenio = await TransferenciaRecebidaConvenio.create(
            orgao_repassador=orgao_repassador,
            numero_convenio=numero_convenio,
            ano_convenio=ano_convenio,
            objeto=objeto,
            valor_total=Decimal(str(valor_total)) if valor_total is not None else None,
            valor_repassado=Decimal(str(valor_repassado)) if valor_repassado is not None else None,
            data_inicio_vigencia=data_inicio_vigencia,
            data_fim_vigencia=data_fim_vigencia,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return convenio.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))


@router.patch("/{convenio_id}/")
async def atualizar_transferencia_recebida(
    request: Request,
    convenio_id: UUID = Path(...),
    orgao_repassador: Optional[str] = Form(None),
    numero_convenio: Optional[str] = Form(None),
    ano_convenio: Optional[int] = Form(None),
    objeto: Optional[str] = Form(None),
    valor_total: Optional[float] = Form(None),
    valor_repassado: Optional[float] = Form(None),
    data_inicio_vigencia: Optional[date] = Form(None),
    data_fim_vigencia: Optional[date] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        convenio = await TransferenciaRecebidaConvenio.get(id=convenio_id)
        if orgao_repassador is not None:
            convenio.orgao_repassador = orgao_repassador
        if numero_convenio is not None:
            convenio.numero_convenio = numero_convenio
        if ano_convenio is not None:
            convenio.ano_convenio = ano_convenio
        if objeto is not None:
            convenio.objeto = objeto
        if valor_total is not None:
            convenio.valor_total = Decimal(str(valor_total))
        if valor_repassado is not None:
            convenio.valor_repassado = Decimal(str(valor_repassado))
        if data_inicio_vigencia is not None:
            convenio.data_inicio_vigencia = data_inicio_vigencia
        if data_fim_vigencia is not None:
            convenio.data_fim_vigencia = data_fim_vigencia
        if file is not None:
            convenio.arquivo = await file.read()
        await convenio.save()
        return convenio.to_dict()
    except DoesNotExist:
        raise NotFoundException("Convênio não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.delete("/{convenio_id}/")
async def deletar_transferencia_recebida(request: Request, convenio_id: UUID = Path(...)):
    try:
        convenio = await TransferenciaRecebidaConvenio.get(id=convenio_id)
        await convenio.delete()
        return {"message": "Convênio deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Convênio não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
