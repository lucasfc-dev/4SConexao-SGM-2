from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import EmendaParlamentar
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from typing import Optional
from decimal import Decimal
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/emenda_parlamentar",
    tags=["Emenda Parlamentar"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{emenda_id}/arquivo/")
async def obter_arquivo_emenda_parlamentar(request: Request, emenda_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        emenda = await EmendaParlamentar.get(id=emenda_id).only('arquivo', 'origem')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{emenda.origem.strip()}.pdf",
            content_length=len(emenda.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(emenda.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Emenda não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{emenda_id}/detalhes/")
async def obter_emenda_parlamentar(request: Request, emenda_id: UUID = Path(...)):
    try:
        emenda = await EmendaParlamentar.get(id=emenda_id)
        return emenda.to_dict()
    except DoesNotExist:
        raise NotFoundException("Emenda não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_emendas_parlamentares(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    origem: Optional[str] = Query(None),
    ano_referencia: Optional[int] = Query(None),
    beneficiario: Optional[str] = Query(None),
    autor: Optional[str] = Query(None),
    forma_repasse: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    funcao_governo: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
):
    try:
        query = EmendaParlamentar.filter(estabelecimento=estabelecimento_id)
        if origem:
            query = query.filter(origem__icontains=origem)
        if ano_referencia:
            query = query.filter(ano_referencia=ano_referencia)
        if beneficiario:
            query = query.filter(beneficiario__icontains=beneficiario)
        if autor:
            query = query.filter(autor__icontains=autor)
        if origem:
            query = query.filter(origem__icontains=origem)
        if forma_repasse:
            query = query.filter(forma_repasse__icontains=forma_repasse)
        if tipo:
            query = query.filter(tipo__icontains=tipo)
        if funcao_governo:
            query = query.filter(funcao_governo__icontains=funcao_governo)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)

        emendas = await query.only(
            'origem', 'origem', 'forma_repasse', 'tipo', 'numero', 'autor',
            'valor_previsto', 'valor_repassado', 'ano_referencia', 'objeto',
            'beneficiario', 'funcao_governo', 'data_publicacao'
        )

        rows = [
            {
                "Origem": e.origem,
                "Forma Repasse": e.forma_repasse,
                "Tipo": e.tipo,
                "Numero": e.numero,
                "Autor": e.autor,
                "Valor Previsto": e.valor_previsto,
                "Valor Repassado": e.valor_repassado,
                "Ano Referencia": e.ano_referencia,
                "Objeto": e.objeto,
                "Beneficiario": e.beneficiario,
                "Funcao Governo": e.funcao_governo,
                "Data Publicacao": e.data_publicacao,
            }
            for e in emendas
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"emenda_parlamentar_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{estabelecimento_id}/")
async def listar_emendas_parlamentares(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    origem: Optional[str] = Query(None),
    ano_referencia: Optional[int] = Query(None),
    beneficiario: Optional[str] = Query(None),
    autor: Optional[str] = Query(None),
    forma_repasse: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    funcao_governo: Optional[str] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = EmendaParlamentar.filter(estabelecimento=estabelecimento_id)
        if origem:
            query = query.filter(origem__icontains=origem)
        if ano_referencia:
            query = query.filter(ano_referencia=ano_referencia)
        if beneficiario:
            query = query.filter(beneficiario__icontains=beneficiario)
        if autor:
            query = query.filter(autor__icontains=autor)
        if origem:
            query = query.filter(origem__icontains=origem)
        if forma_repasse:
            query = query.filter(forma_repasse__icontains=forma_repasse)
        if tipo:
            query = query.filter(tipo__icontains=tipo)
        if funcao_governo:
            query = query.filter(funcao_governo__icontains=funcao_governo)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        total = await query.count()
        emendas = await query.offset(offset).limit(limit)
        data = [e.to_dict() for e in emendas]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_emenda_parlamentar(
    request: Request,
    data_publicacao: Optional[date] = Form(None),
    origem: Optional[str] = Form(None),
    forma_repasse: Optional[str] = Form(None),
    tipo: Optional[str] = Form(None),
    numero: Optional[int] = Form(None),
    autor: Optional[str] = Form(None),
    valor_previsto: Optional[float] = Form(None),
    valor_repassado: Optional[float] = Form(None),
    ano_referencia: Optional[int] = Form(None),
    objeto: Optional[str] = Form(None),
    beneficiario: Optional[str] = Form(None),
    funcao_governo: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        client = request.state.client
        emenda = await EmendaParlamentar.create(
            data_publicacao=data_publicacao,
            origem=origem,
            forma_repasse=forma_repasse,
            tipo=tipo,
            numero=numero,
            autor=autor,
            valor_previsto=Decimal(str(valor_previsto)) if valor_previsto is not None else None,
            valor_repassado=Decimal(str(valor_repassado)) if valor_repassado is not None else None,
            ano_referencia=ano_referencia,
            objeto=objeto,
            beneficiario=beneficiario,
            funcao_governo=funcao_governo,
            arquivo=await file.read() if file else None,
            estabelecimento=client.estabelecimento.id
        )
        return emenda.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{emenda_id}/")
async def atualizar_emenda_parlamentar(
    request: Request,
    emenda_id: UUID = Path(...),
    data_publicacao: Optional[date] = Form(None),
    origem: Optional[str] = Form(None),
    forma_repasse: Optional[str] = Form(None),
    tipo: Optional[str] = Form(None),
    numero: Optional[int] = Form(None),
    autor: Optional[str] = Form(None),
    valor_previsto: Optional[float] = Form(None),
    valor_repassado: Optional[float] = Form(None),
    ano_referencia: Optional[int] = Form(None),
    objeto: Optional[str] = Form(None),
    beneficiario: Optional[str] = Form(None),
    funcao_governo: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        emenda = await EmendaParlamentar.get(id=emenda_id)
        
        if data_publicacao is not None:
            emenda.data_publicacao = data_publicacao
        if origem is not None:
            emenda.origem = origem
        if forma_repasse is not None:
            emenda.forma_repasse = forma_repasse
        if tipo is not None:
            emenda.tipo = tipo
        if numero is not None:
            emenda.numero = numero
        if autor is not None:
            emenda.autor = autor
        if valor_previsto is not None:
            emenda.valor_previsto = Decimal(str(valor_previsto))
        if valor_repassado is not None:
            emenda.valor_repassado = Decimal(str(valor_repassado))
        if ano_referencia is not None:
            emenda.ano_referencia = ano_referencia
        if objeto is not None:
            emenda.objeto = objeto
        if beneficiario is not None:
            emenda.beneficiario = beneficiario
        if funcao_governo is not None:
            emenda.funcao_governo = funcao_governo
        if file is not None:
            emenda.arquivo = await file.read()
        
        await emenda.save()
        return emenda.to_dict()
    except DoesNotExist:
        raise NotFoundException("Emenda não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{emenda_id}/")
async def deletar_emenda_parlamentar(
    request: Request,
    emenda_id: UUID = Path(...)
):
    try:
        emenda = await EmendaParlamentar.get(id=emenda_id)
        await emenda.delete()
        return {"message": "Emenda deletada com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Emenda não encontrada")
    except Exception as e:
        raise BadRequestException(str(e))
