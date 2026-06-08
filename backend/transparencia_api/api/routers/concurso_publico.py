from fastapi import APIRouter, Request, UploadFile, Path, Form, File, Query
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from api.exceptions import NotFoundException, BadRequestException
from api.models import ConcursoPublico, TipoProcessoConcurso, SituacaoConcurso
from api.schemas import BaseResponse
from datetime import date
from uuid import UUID
from io import BytesIO
from typing import Optional
from api.utils.exporters import exportar_em_formato

router = APIRouter(
    prefix="/concurso_publico",
    tags=["Concurso Público"],
)

# Rotas mais específicas primeiro (com literais no path)
@router.get("/{concurso_id}/arquivo/")
async def obter_arquivo_concurso_publico(request: Request, concurso_id: UUID = Path(...)):
    try:
        # Otimização: carregar apenas campos necessários
        concurso = await ConcursoPublico.get(id=concurso_id).only('arquivo', 'numero_edital')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{concurso.numero_edital.strip()}.pdf",
            content_length=len(concurso.arquivo),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(concurso.arquivo),
            media_type="application/pdf",
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException("Concurso não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.get("/{concurso_id}/detalhes/")
async def obter_concurso_publico(request: Request, concurso_id: UUID = Path(...)):
    try:
        concurso = await ConcursoPublico.get(id=concurso_id)
        return concurso.to_dict()
    except DoesNotExist:
        raise NotFoundException("Concurso não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))


@router.get("/{estabelecimento_id}/exportar/")
async def exportar_concursos_publicos(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    type: str = Query("csv"),
    tipo_processo: Optional[TipoProcessoConcurso] = Query(None),
    situacao: Optional[SituacaoConcurso] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    data_inicio_inscricoes__gte: Optional[date] = Query(None),
    data_inicio_inscricoes__lte: Optional[date] = Query(None),
    data_homologacao__gte: Optional[date] = Query(None),
    data_homologacao__lte: Optional[date] = Query(None),
    data_validade__gte: Optional[date] = Query(None),
    data_validade__lte: Optional[date] = Query(None),
    veiculo_publicacao: Optional[str] = Query(None),
):
    try:
        query = ConcursoPublico.filter(estabelecimento=estabelecimento_id)
        if tipo_processo:
            query = query.filter(tipo_processo=tipo_processo)
        if situacao:
            query = query.filter(situacao=situacao)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if data_inicio_inscricoes__gte:
            query = query.filter(data_inicio_inscricoes__gte=data_inicio_inscricoes__gte)
        if data_inicio_inscricoes__lte:
            query = query.filter(data_inicio_inscricoes__lte=data_inicio_inscricoes__lte)
        if data_homologacao__gte:
            query = query.filter(data_homologacao__gte=data_homologacao__gte)
        if data_homologacao__lte:
            query = query.filter(data_homologacao__lte=data_homologacao__lte)
        if data_validade__gte:
            query = query.filter(data_validade__gte=data_validade__gte)
        if data_validade__lte:
            query = query.filter(data_validade__lte=data_validade__lte)
        if veiculo_publicacao:
            query = query.filter(veiculo_publicacao__icontains=veiculo_publicacao)

        concursos = await query.only(
            'tipo_processo', 'numero_edital', 'data_publicacao', 'data_inicio_inscricoes',
            'data_homologacao', 'data_validade', 'veiculo_publicacao', 'situacao'
        )

        rows = [
            {
                "Tipo Processo": c.tipo_processo,
                "Numero Edital": c.numero_edital,
                "Situacao": c.situacao,
                "Data Publicacao": c.data_publicacao,
                "Data Inicio Inscricoes": c.data_inicio_inscricoes,
                "Data Homologacao": c.data_homologacao,
                "Data Validade": c.data_validade,
                "Veiculo Publicacao": c.veiculo_publicacao,
            }
            for c in concursos
        ]

        return await exportar_em_formato(
            export_type=type,
            estabelecimento_id=estabelecimento_id,
            rows=rows,
            filename_prefix=f"concurso_publico_{date.today()}",
        )
    except Exception as e:
        raise BadRequestException(str(e))

# Rotas com 1 parâmetro de path (mais genéricas)
@router.get("/{estabelecimento_id}/")
async def listar_concursos_publicos(
    request: Request,
    estabelecimento_id: UUID = Path(...),
    tipo_processo: Optional[TipoProcessoConcurso] = Query(None),
    situacao: Optional[SituacaoConcurso] = Query(None),
    data_publicacao__gte: Optional[date] = Query(None),
    data_publicacao__lte: Optional[date] = Query(None),
    data_inicio_inscricoes__gte: Optional[date] = Query(None),
    data_inicio_inscricoes__lte: Optional[date] = Query(None),
    data_homologacao__gte: Optional[date] = Query(None),
    data_homologacao__lte: Optional[date] = Query(None),
    data_validade__gte: Optional[date] = Query(None),
    data_validade__lte: Optional[date] = Query(None),
    veiculo_publicacao: Optional[str] = Query(None),
    offset: int = Query(0), limit: int = Query(10)):
    try:
        query = ConcursoPublico.filter(estabelecimento=estabelecimento_id)
        if tipo_processo:
            query = query.filter(tipo_processo=tipo_processo)
        if situacao:
            query = query.filter(situacao=situacao)
        if data_publicacao__gte:
            query = query.filter(data_publicacao__gte=data_publicacao__gte)
        if data_publicacao__lte:
            query = query.filter(data_publicacao__lte=data_publicacao__lte)
        if data_inicio_inscricoes__gte:
            query = query.filter(data_inicio_inscricoes__gte=data_inicio_inscricoes__gte)
        if data_inicio_inscricoes__lte:
            query = query.filter(data_inicio_inscricoes__lte=data_inicio_inscricoes__lte)
        if data_homologacao__gte:
            query = query.filter(data_homologacao__gte=data_homologacao__gte)
        if data_homologacao__lte:
            query = query.filter(data_homologacao__lte=data_homologacao__lte)
        if data_validade__gte:
            query = query.filter(data_validade__gte=data_validade__gte)
        if data_validade__lte:
            query = query.filter(data_validade__lte=data_validade__lte)
        if veiculo_publicacao:
            query = query.filter(veiculo_publicacao__icontains=veiculo_publicacao)
        total = await query.count()
        concursos = await query.offset(offset).limit(limit)
        data = [c.to_dict() for c in concursos]
        return BaseResponse(data=data, meta={"total": total, "page": (offset // limit) + 1, "page_size": limit})
    except Exception as e:
        raise BadRequestException(str(e))

@router.post("/")
async def criar_concurso_publico(
    request: Request,
    tipo_processo: Optional[TipoProcessoConcurso] = Form(None),
    numero_edital: Optional[str] = Form(None),
    data_publicacao: Optional[date] = Form(None),
    situacao: Optional[SituacaoConcurso] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_inicio_inscricoes: Optional[date] = Form(None),
    data_homologacao: Optional[date] = Form(None),
    data_validade: Optional[date] = Form(None),
    veiculo_publicacao: Optional[str] = Form(None),
):
    try:
        client = request.state.client
        concurso = await ConcursoPublico.create(
            tipo_processo=tipo_processo,
            numero_edital=numero_edital,
            data_publicacao=data_publicacao,
            situacao=situacao,
            arquivo=await file.read() if file else None,
            data_inicio_inscricoes=data_inicio_inscricoes,
            data_homologacao=data_homologacao,
            data_validade=data_validade,
            veiculo_publicacao=veiculo_publicacao,
            estabelecimento=client.estabelecimento.id
        )
        return concurso.to_dict()
    except Exception as e:
        raise BadRequestException(str(e))

@router.patch("/{concurso_id}/")
async def atualizar_concurso_publico(
    request: Request,
    concurso_id: UUID = Path(...),
    tipo_processo: Optional[TipoProcessoConcurso] = Form(None),
    numero_edital: Optional[str] = Form(None),
    data_publicacao: Optional[date] = Form(None),
    situacao: Optional[SituacaoConcurso] = Form(None),
    file: Optional[UploadFile] = File(None),
    data_inicio_inscricoes: Optional[date] = Form(None),
    data_homologacao: Optional[date] = Form(None),
    data_validade: Optional[date] = Form(None),
    veiculo_publicacao: Optional[str] = Form(None),
):
    try:
        concurso = await ConcursoPublico.get(id=concurso_id)
        
        if tipo_processo is not None:
            concurso.tipo_processo = tipo_processo
        if numero_edital is not None:
            concurso.numero_edital = numero_edital
        if data_publicacao is not None:
            concurso.data_publicacao = data_publicacao
        if situacao is not None:
            concurso.situacao = situacao
        if data_inicio_inscricoes is not None:
            concurso.data_inicio_inscricoes = data_inicio_inscricoes
        if data_homologacao is not None:
            concurso.data_homologacao = data_homologacao
        if data_validade is not None:
            concurso.data_validade = data_validade
        if veiculo_publicacao is not None:
            concurso.veiculo_publicacao = veiculo_publicacao
        if file is not None:
            concurso.arquivo = await file.read()
        
        await concurso.save()
        return concurso.to_dict()
    except DoesNotExist:
        raise NotFoundException("Concurso não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))

@router.delete("/{concurso_id}/")
async def deletar_concurso_publico(
    request: Request,
    concurso_id: UUID = Path(...)
):
    try:
        concurso = await ConcursoPublico.get(id=concurso_id)
        await concurso.delete()
        return {"message": "Concurso deletado com sucesso"}
    except DoesNotExist:
        raise NotFoundException("Concurso não encontrado")
    except Exception as e:
        raise BadRequestException(str(e))
