"""Webhooks recebidos do auth_api (push) — apenas estrutura de pastas.

Autenticação: header X-API-Key, validado no middleware (não popula request.state.client).
Permissões NÃO são materializadas: acesso é resolvido ao vivo em get_access.
"""
from fastapi.routing import APIRouter

from api.schemas import AcervoAtivadoIn, OrgaoCriadoIn
from api.services.sync import sync_service

router = APIRouter(prefix='/webhooks', tags=['webhooks'])


@router.post('/acervo-ativado/')
async def acervo_ativado(payload: AcervoAtivadoIn):
    await sync_service.apply_acervo_ativado(
        estabelecimento_id=payload.estabelecimento_id,
        orgaos=[o.model_dump() for o in payload.orgaos],
        granted_by=payload.granted_by,
    )
    return {'ok': True}


@router.post('/orgao-criado/')
async def orgao_criado(payload: OrgaoCriadoIn):
    await sync_service.apply_orgao_criado(
        estabelecimento_id=payload.estabelecimento_id,
        orgao=payload.orgao.model_dump(),
        granted_by=payload.granted_by,
    )
    return {'ok': True}
