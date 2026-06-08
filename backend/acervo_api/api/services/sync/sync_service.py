"""Criação de estrutura de pastas a partir de eventos do auth_api (webhooks).

Apenas estrutura — permissões NÃO são materializadas aqui. Acesso é resolvido ao
vivo em permission_service.get_access (órgão + dono + grants explícitos).
Toda função é idempotente, segura contra reenvio/reconciliação.
"""
from uuid import UUID, uuid4

from api.models import Folder


async def _ensure_root(estabelecimento_id: UUID, owner_id: UUID) -> Folder:
    root = await Folder.filter(
        estabelecimento=estabelecimento_id, is_root=True, parent=None
    ).first()
    if root is None:
        root = await Folder.create(
            id=uuid4(),
            nome='Raiz',
            parent=None,
            estabelecimento=estabelecimento_id,
            is_root=True,
            owner_user=owner_id,
        )
    return root


async def _ensure_orgao_folder(
    estabelecimento_id: UUID,
    root: Folder,
    orgao_id: UUID,
    nome: str,
    owner_id: UUID,
) -> Folder:
    # Casa primeiro por orgao_id (robusto a renomeação); cai para nome por compat.
    folder = await Folder.filter(
        estabelecimento=estabelecimento_id, orgao=orgao_id
    ).first()
    if folder is None:
        folder = await Folder.filter(
            estabelecimento=estabelecimento_id, parent=root, nome=nome
        ).first()
    if folder is None:
        folder = await Folder.create(
            id=uuid4(),
            nome=nome,
            parent=root,
            estabelecimento=estabelecimento_id,
            is_root=False,
            orgao=orgao_id,
            owner_user=owner_id,
        )
    return folder


async def apply_acervo_ativado(
    estabelecimento_id: UUID,
    orgaos: list[dict],
    granted_by: UUID,
) -> None:
    """Garante Raiz + uma pasta por órgão. Idempotente (também é o reconcile)."""
    root = await _ensure_root(estabelecimento_id, granted_by)
    for orgao in orgaos:
        await _ensure_orgao_folder(
            estabelecimento_id, root, orgao['id'], orgao['nome'], granted_by
        )


async def apply_orgao_criado(
    estabelecimento_id: UUID,
    orgao: dict,
    granted_by: UUID,
) -> None:
    """Cria a pasta de um órgão novo (idempotente)."""
    root = await _ensure_root(estabelecimento_id, granted_by)
    await _ensure_orgao_folder(
        estabelecimento_id, root, orgao['id'], orgao['nome'], granted_by
    )
