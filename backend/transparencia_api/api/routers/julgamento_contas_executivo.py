from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import JulgamentoContasExecutivo, CategoriaDocumentoNumerado
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/julgamento_contas_executivo",
    tags=["Julgamento Contas Executivo"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{julgamento_id}/arquivo/")
async def obter_arquivo_julgamento_contas(request: Request, julgamento_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        julgamento = await JulgamentoContasExecutivo.get(id=julgamento_id).only('arquivo', 'numero', 'data_publicacao')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{julgamento.numero.strip()}/{julgamento.data_publicacao.year}.pdf",
            content_length=len(julgamento.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(julgamento.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Julgamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{julgamento_id}/detalhes/")
async def obter_julgamento_contas(request: Request, julgamento_id: UUID = Path(...)):
    try:
        julgamento = await JulgamentoContasExecutivo.get(id=julgamento_id)
        return julgamento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Julgamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_julgamentos_contas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    numero: Optional[str] = Query(None),
    ano_processo: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    data_resultado__gte: Optional[date] = Query(None),
    data_resultado__lte: Optional[date] = Query(None),
):
    try:
        query = JulgamentoContasExecutivo.filter(estabelecimento=estabelecimento_id)
        if numero:
            query = query.filter(numero=numero)
        if ano_processo:
            query = query.filter(ano_processo=ano_processo)
        if status:
            query = query.filter(status=status)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if data_resultado__gte:
            query = query.filter(data_resultado__gte=data_resultado__gte)
        if data_resultado__lte:
            query = query.filter(data_resultado__lte=data_resultado__lte)

        julgamentos = await query.only(
            'numero', 'ano_processo', 'status', 'data_publicacao', 'data_resultado'
        )

        rows = [
            {
                "Numero": j.numero,
                "Ano Processo": j.ano_processo,
                "Status": j.status,
                "Data Publicacao": j.data_publicacao,
                "Data Resultado": j.data_resultado,
            }
            for j in julgamentos
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"julgamento_contas_executivo_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{estabelecimento_id}/")
async def listar_julgamentos_contas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    numero: Optional[str] = Query(None),
    ano_processo: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    data_resultado__gte: Optional[date] = Query(None),
    data_resultado__lte: Optional[date] = Query(None),
    
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = JulgamentoContasExecutivo.filter(estabelecimento=estabelecimento_id)
        if numero:
            query = query.filter(numero=numero)
        if ano_processo:
            query = query.filter(ano_processo=ano_processo)
        if status:
            query = query.filter(status=status)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if data_resultado__gte:
            query = query.filter(data_resultado__gte=data_resultado__gte)
        if data_resultado__lte:
            query = query.filter(data_resultado__lte=data_resultado__lte)
        total = await query.count()
        julgamentos = await query.offset(offset).limit(limit)
        data = [j.to_dict() for j in julgamentos]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_julgamento_contas(
    request: Request,
    data_publicacao: Optional[date] = Form(None),
    numero: Optional[str] = Form(None),
    ano_processo: Optional[int] = Form(None),
    status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_resultado: Optional[date] = Form(None),
):
    try:
        client = request.state.client
        julgamento = await JulgamentoContasExecutivo.create(
            data_publicacao=data_publicacao,
            numero=numero,
            ano_processo=ano_processo,
            status=status,
            data_resultado=data_resultado,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return julgamento.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{julgamento_id}/")
async def atualizar_julgamento_contas(
    request: Request,
    julgamento_id: UUID = Path(...),
    data_publicacao: Optional[date] = Form(None),
    numero: Optional[str] = Form(None),
    ano_processo: Optional[int] = Form(None),
    status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_resultado: Optional[date] = Form(None),
):
    try:
        julgamento = await JulgamentoContasExecutivo.get(id=julgamento_id)
        
        if data_publicacao is not None:
            julgamento.data_publicacao = data_publicacao
        if numero is not None:
            julgamento.numero = numero
        if ano_processo is not None:
            julgamento.ano_processo = ano_processo
        if status is not None:
            julgamento.status = status
        if data_resultado is not None:
            julgamento.data_resultado = data_resultado
        if file is not None:
            julgamento.arquivo = await file.read()
        
        await julgamento.save()
        return julgamento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Julgamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{julgamento_id}/")
async def deletar_julgamento_contas(
    request: Request,
    julgamento_id: UUID = Path(...)
):
    try:
        julgamento = await JulgamentoContasExecutivo.get(id=julgamento_id)
        await julgamento.delete()
        return {"message": "Julgamento deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Julgamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
