from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import ApreciacaoContas
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/apreciacao_contas",
    tags=["Apreciação das Contas"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{apreciacao_id}/arquivo/")
async def obter_arquivo_apreciacao_contas(request: Request, apreciacao_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        apreciacao = await ApreciacaoContas.get(id=apreciacao_id).only('arquivo', 'nome')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{apreciacao.nome.strip()}.pdf",
            content_length=len(apreciacao.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(apreciacao.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Apreciação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{apreciacao_id}/detalhes/")
async def obter_apreciacao_contas(request: Request, apreciacao_id: UUID = Path(...)):
    try:
        apreciacao = await ApreciacaoContas.get(id=apreciacao_id)
        return apreciacao.to_dict()
    except DoesNotExist:
        raise NotFoundException("Apreciação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_apreciacoes_contas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    nome: Optional[str] = Query(None),
    data_resultado__gte: Optional[date] = Query(None),
    data_resultado__lte: Optional[date] = Query(None),
    data_registro__gte: Optional[date] = Query(None),
    data_registro__lte: Optional[date] = Query(None),
    modalidade: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    try:
        query = ApreciacaoContas.filter(estabelecimento=estabelecimento_id)
        if nome:
            query = query.filter(nome__icontains=nome)
        if data_registro__gte:
            query = query.filter(data_registro__gte=data_registro__gte)
        if data_registro__lte:
            query = query.filter(data_registro__lte=data_registro__lte)
        if data_resultado__gte:
            query = query.filter(data_resultado__gte=data_resultado__gte)
        if data_resultado__lte:
            query = query.filter(data_resultado__lte=data_resultado__lte)
        if modalidade:
            query = query.filter(modalidade__icontains=modalidade)
        if status:
            query = query.filter(status__icontains=status)

        apreciacoes = await query.only(
            'nome', 'descricao', 'modalidade', 'status', 'data_registro', 'data_resultado'
        )

        rows = [
            {
                "Nome": a.nome,
                "Descricao": a.descricao,
                "Modalidade": a.modalidade,
                "Status": a.status,
                "Data Registro": a.data_registro,
                "Data Resultado": a.data_resultado,
            }
            for a in apreciacoes
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"apreciacao_contas_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{estabelecimento_id}/")
async def listar_apreciacoes_contas(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    nome: Optional[str] = Query(None),
    data_resultado__gte: Optional[date] = Query(None),
    data_resultado__lte: Optional[date] = Query(None),
    data_registro__gte: Optional[date] = Query(None),
    data_registro__lte: Optional[date] = Query(None),
    modalidade: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    offset: int = Query(0),
    limit: int = Query(10)
):
    try:
        query = ApreciacaoContas.filter(estabelecimento=estabelecimento_id)
        if nome:
            query = query.filter(nome__icontains=nome)
        if data_registro__gte:
            query = query.filter(data_registro__gte=data_registro__gte)
        if data_registro__lte:
            query = query.filter(data_registro__lte=data_registro__lte)
        if data_resultado__gte:
            query = query.filter(data_resultado__gte=data_resultado__gte)
        if data_resultado__lte:
            query = query.filter(data_resultado__lte=data_resultado__lte)
        if modalidade:
            query = query.filter(modalidade__icontains=modalidade)
        if status:
            query = query.filter(status__icontains=status)
        total = await query.count()
        apreciacoes = await query.offset(offset).limit(limit)
        data = [a.to_dict() for a in apreciacoes]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_apreciacao_contas(
    request: Request,
    data_registro: Optional[date] = Form(None),
    modalidade: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    nome: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    descricao: Optional[str] = Form(None),
    data_resultado: Optional[date] = Form(None),
):
    try:
        client = request.state.client
        apreciacao = await ApreciacaoContas.create(
            data_registro=data_registro,
            data_resultado=data_resultado,
            modalidade=modalidade,
            status=status,
            nome=nome,
            descricao=descricao,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return apreciacao.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{apreciacao_id}/")
async def atualizar_apreciacao_contas(
    request: Request,
    apreciacao_id: UUID = Path(...),
    data_registro: Optional[date] = Form(None),
    modalidade: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    nome: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    descricao: Optional[str] = Form(None),
    data_resultado: Optional[date] = Form(None),
):
    try:
        apreciacao = await ApreciacaoContas.get(id=apreciacao_id)
        
        if data_registro is not None:
            apreciacao.data_registro = data_registro
        if data_resultado is not None:
            apreciacao.data_resultado = data_resultado
        if modalidade is not None:
            apreciacao.modalidade = modalidade
        if status is not None:
            apreciacao.status = status
        if nome is not None:
            apreciacao.nome = nome
        if descricao is not None:
            apreciacao.descricao = descricao
        if file is not None:
            apreciacao.arquivo = await file.read()
        
        await apreciacao.save()
        return apreciacao.to_dict()
    except DoesNotExist:
        raise NotFoundException("Apreciação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{apreciacao_id}/")
async def deletar_apreciacao_contas(
    request: Request,
    apreciacao_id: UUID = Path(...)
):
    try:
        apreciacao = await ApreciacaoContas.get(id=apreciacao_id)
        await apreciacao.delete()
        return {"message": "Apreciação deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Apreciação não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))
