from fastapi import Request,HTTPException
from fastapi.routing import APIRouter
from api.services.auth.auth_service import AuthClient
from api.models import Vereador,Document,Tipo
from api.schemas import UserOut
from api.config import AUTH_API_URL
from tortoise.functions import Count
import requests

router = APIRouter(prefix='/statistic',tags=['statistic'])

@router.get('/docs_vereador/')
async def get_num_docs_vereador(request:Request):
    client:AuthClient = request.state.client
    statistics = await Document.filter(estabelecimento=client.estabelecimento.id) \
        .group_by("vereador__id",) \
        .annotate(docs=Count("id")) \
        .values(vereador="vereador__nome", docs="docs")
    for statistic in statistics:
        if statistic['vereador'] == None:
            statistic['vereador'] = 'Sem Vereador'
    return statistics

@router.get('/docs_tipo/')
async def get_num_docs_tipo(request: Request):
    client:AuthClient = request.state.client   

    statistics = await Document.filter(estabelecimento=client.estabelecimento.id) \
        .group_by("tipo__id",) \
        .annotate(docs=Count("id")) \
        .values(tipo="tipo__nome",docs="docs")

    return statistics

@router.get('/docs_orgao/')
async def get_num_docs_orgao(request: Request):
    client:AuthClient = request.state.client
    estabelecimento = client.estabelecimento
    statistics = []
    orgaos = await estabelecimento.get_orgaos()
    for orgao in orgaos:
        documents_count = await Document.filter(orgao=orgao['id']).count()
        statistics.append({'orgao': orgao['nome'], 'docs': documents_count})
    return statistics

@router.get('/docs_situacao/')
async def get_num_docs_tipo(request: Request):
    client:AuthClient = request.state.client
    statistics = await Document.filter(estabelecimento=client.estabelecimento.id) \
        .group_by("situacao") \
        .annotate(docs=Count("id")) \
        .values("situacao", "docs")
    return statistics
