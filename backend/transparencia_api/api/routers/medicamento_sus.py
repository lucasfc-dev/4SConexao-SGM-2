from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import MedicamentoSUS
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/medicamento_sus",
    tags=["Medicamentos SUS"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{medicamento_id}/arquivo/")
async def obter_arquivo_medicamento_sus(request: Request, medicamento_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        medicamento = await MedicamentoSUS.get(id=medicamento_id).only('arquivo', 'nome_unidade')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{medicamento.nome_unidade.strip()}.pdf",
            content_length=len(medicamento.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(medicamento.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Medicamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{medicamento_id}/detalhes/")
async def obter_medicamento_sus(request: Request, medicamento_id: UUID = Path(...)):
    try:
        medicamento = await MedicamentoSUS.get(id=medicamento_id)
        return medicamento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Medicamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_medicamentos_sus(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    nome_unidade: Optional[str] = Query(None),
    endereco: Optional[str] = Query(None),
):
    try:
        query = MedicamentoSUS.filter(estabelecimento=estabelecimento_id)
        if nome_unidade:
            query = query.filter(nome_unidade__icontains=nome_unidade)
        if endereco:
            query = query.filter(endereco__icontains=endereco)

        medicamentos = await query.only(
            'nome_unidade', 'endereco', 'telefone', 'created_at'
        )

        rows = [
            {
                "Nome Unidade": m.nome_unidade,
                "Endereco": m.endereco,
                "Telefone": m.telefone,
                "Data Registro": m.created_at.date() if m.created_at else None,
            }
            for m in medicamentos
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"medicamento_sus_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{estabelecimento_id}/")
async def listar_medicamentos_sus(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    nome_unidade: Optional[str] = Query(None),
    endereco: Optional[str] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = MedicamentoSUS.filter(estabelecimento=estabelecimento_id)
        if nome_unidade:
            query = query.filter(nome_unidade=nome_unidade)
        if endereco:
            query = query.filter(endereco=endereco)
        total = await query.count()
        medicamentos = await query.offset(offset).limit(limit)
        data = [m.to_dict() for m in medicamentos]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_medicamento_sus(
    request: Request,
    nome_unidade: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    telefone: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        client = request.state.client
        medicamento = await MedicamentoSUS.create(
            nome_unidade=nome_unidade,
            endereco=endereco,
            telefone=telefone,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return medicamento.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{medicamento_id}/")
async def atualizar_medicamento_sus(
    request: Request,
    medicamento_id: UUID = Path(...),
    nome_unidade: Optional[str] = Form(None),
    endereco: Optional[str] = Form(None),
    telefone: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        medicamento = await MedicamentoSUS.get(id=medicamento_id)
        
        if nome_unidade is not None:
            medicamento.nome_unidade = nome_unidade
        if endereco is not None:
            medicamento.endereco = endereco
        if telefone is not None:
            medicamento.telefone = telefone
        if file is not None:
            medicamento.arquivo = await file.read()
        
        await medicamento.save()
        return medicamento.to_dict()
    except DoesNotExist:
        raise NotFoundException("Medicamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{medicamento_id}/")
async def deletar_medicamento_sus(
    request: Request,
    medicamento_id: UUID = Path(...)
):
    try:
        medicamento = await MedicamentoSUS.get(id=medicamento_id)
        await medicamento.delete()
        return {"message": "Medicamento deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Medicamento não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
