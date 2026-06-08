"""Cliente de webhooks do auth_api -> acervo_api (modelo push).

Apenas eventos de ESTRUTURA de pasta (acervo ativado, órgão criado). Permissões são
resolvidas ao vivo no acervo_api (vínculo de órgão + dono), então não há webhook de
permissão. Entrega best-effort: falha é logada e NÃO propaga; a reconciliação corrige.
"""
import logging
from uuid import UUID

import httpx

from api.config import ACERVO_API_URL, INTER_SERVICE_API_KEY
from api.models import Estabelecimento, Orgao

logger = logging.getLogger(__name__)

ACERVO_FUNC = 'Acervo Digital'
_TIMEOUT = 5.0


def _headers() -> dict:
    return {'X-API-Key': INTER_SERVICE_API_KEY or ''}


async def _post(path: str, payload: dict) -> None:
    if not ACERVO_API_URL:
        logger.warning('ACERVO_API_URL não configurada; webhook %s ignorado', path)
        return
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f'{ACERVO_API_URL}{path}', json=payload, headers=_headers()
            )
            resp.raise_for_status()
    except Exception as e:  # best-effort
        logger.warning('Webhook acervo %s falhou: %s', path, e)


async def estab_tem_acervo(estabelecimento: Estabelecimento) -> bool:
    """True se o pacote do estabelecimento contém a funcionalidade 'Acervo Digital'."""
    pacote = await estabelecimento.pacote
    funcs = await pacote.funcionalidades.all()
    return any(f.nome == ACERVO_FUNC for f in funcs)


async def _orgaos_payload(estabelecimento: Estabelecimento) -> list[dict]:
    orgaos = await Orgao.filter(estabelecimento=estabelecimento)
    return [{'id': str(o.id), 'nome': o.nome} for o in orgaos]


# ----------------- Eventos (estrutura) -----------------

async def acervo_ativado(estabelecimento: Estabelecimento, granted_by: UUID) -> None:
    """Acervo Digital ativado no estab — cria Raiz + pastas de órgão.
    Também é o payload da reconciliação."""
    payload = {
        'estabelecimento_id': str(estabelecimento.id),
        'orgaos': await _orgaos_payload(estabelecimento),
        'granted_by': str(granted_by),
    }
    await _post('/webhooks/acervo-ativado/', payload)


async def orgao_criado(
    estabelecimento: Estabelecimento, orgao: Orgao, granted_by: UUID
) -> None:
    payload = {
        'estabelecimento_id': str(estabelecimento.id),
        'orgao': {'id': str(orgao.id), 'nome': orgao.nome},
        'granted_by': str(granted_by),
    }
    await _post('/webhooks/orgao-criado/', payload)
