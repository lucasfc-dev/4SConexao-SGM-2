from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import RenunciaFiscal
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/renuncia_fiscal",
    tags=["Renúncia Fiscal"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{renuncia_id}/arquivo/")
async def obter_arquivo_renuncia_fiscal(request: Request, renuncia_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        renuncia = await RenunciaFiscal.get(id=renuncia_id).only('arquivo', 'id')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"renuncia_fiscal_{renuncia.id}.pdf",
            content_length=len(renuncia.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(renuncia.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Renúncia não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{renuncia_id}/detalhes/")
async def obter_renuncia_fiscal(request: Request, renuncia_id: UUID = Path(...)):
    try:
        renuncia = await RenunciaFiscal.get(id=renuncia_id)
        return renuncia.to_dict()
    except DoesNotExist:
        raise NotFoundException("Renúncia não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_renuncias_fiscais(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    tipo_receita: Optional[str] = Query(None),
    tipo_renuncia: Optional[str] = Query(None),
):
    try:
        query = RenunciaFiscal.filter(estabelecimento=estabelecimento_id)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if tipo_receita:
            query = query.filter(tipo_receita__icontains=tipo_receita)
        if tipo_renuncia:
            query = query.filter(tipo_renuncia__icontains=tipo_renuncia)

        renuncias = await query.only('tipo_receita', 'tipo_renuncia', 'data_publicacao')

        rows = [
            {
                "Tipo Receita": r.tipo_receita,
                "Tipo Renuncia": r.tipo_renuncia,
                "Data Publicacao": r.data_publicacao,
            }
            for r in renuncias
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"renuncia_fiscal_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{estabelecimento_id}/")
async def listar_renuncias_fiscais(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    tipo_receita: Optional[str] = Query(None),
    tipo_renuncia: Optional[str] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = RenunciaFiscal.filter(estabelecimento=estabelecimento_id)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if tipo_receita:
            query = query.filter(tipo_receita=tipo_receita)
        if tipo_renuncia:
            query = query.filter(tipo_renuncia=tipo_renuncia)
        total = await query.count()
        renuncias = await query.offset(offset).limit(limit)
        data = [r.to_dict() for r in renuncias]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_renuncia_fiscal(
    request: Request,
    data_publicacao: Optional[date] = Form(None),
    tipo_receita: Optional[str] = Form(None),
    tipo_renuncia: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        client = request.state.client
        renuncia = await RenunciaFiscal.create(
            data_publicacao=data_publicacao,
            tipo_receita=tipo_receita,
            tipo_renuncia=tipo_renuncia,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return renuncia.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{renuncia_id}/")
async def atualizar_renuncia_fiscal(
    request: Request,
    renuncia_id: UUID = Path(...),
    data_publicacao: Optional[date] = Form(None),
    tipo_receita: Optional[str] = Form(None),
    tipo_renuncia: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        renuncia = await RenunciaFiscal.get(id=renuncia_id)
        
        if data_publicacao is not None:
            renuncia.data_publicacao = data_publicacao
        if tipo_receita is not None:
            renuncia.tipo_receita = tipo_receita
        if tipo_renuncia is not None:
            renuncia.tipo_renuncia = tipo_renuncia
        if file is not None:
            renuncia.arquivo = await file.read()
        
        await renuncia.save()
        return renuncia.to_dict()
    except DoesNotExist:
        raise NotFoundException("Renúncia não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{renuncia_id}/")
async def deletar_renuncia_fiscal(
    request: Request,
    renuncia_id: UUID = Path(...)
):
    try:
        renuncia = await RenunciaFiscal.get(id=renuncia_id)
        await renuncia.delete()
        return {"message": "Renúncia deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Renúncia não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))
