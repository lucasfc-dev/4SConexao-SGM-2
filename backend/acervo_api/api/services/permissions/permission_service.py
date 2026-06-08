from uuid import UUID
from api.models import Folder, FolderPermission
from api.services.auth.auth_service import AuthClient
from api.exceptions import ForbiddenException


async def get_ancestors(folder: Folder) -> list[Folder]:
    """Retorna [folder, parent, ..., root]."""
    chain = [folder]
    while chain[-1].parent_id:
        parent = await Folder.get(id=chain[-1].parent_id)
        chain.append(parent)
    return chain


async def get_access(client: AuthClient, folder: Folder) -> tuple[bool, bool]:
    """Resolve (can_read, can_write) do client na pasta dada.

    Deny-by-default e aditivo: não existe linha de negação. Fontes de acesso:
    admin do estab, vínculo de órgão (só a própria pasta do órgão), dono da pasta
    ou de ancestral não-raiz, e grants explícitos (FolderPermission). Superuser não
    acessa o acervo — sem estab vinculado, é barrado na checagem de estab abaixo.
    """
    # Admin do estabelecimento: acesso total dentro do próprio estab.
    if (
        client.user.is_admin()
        and client.estabelecimento
        and folder.estabelecimento == client.estabelecimento.id
    ):
        return True, True

    if not client.estabelecimento or folder.estabelecimento != client.estabelecimento.id:
        return False, False

    chain = [folder] if folder.is_root else await get_ancestors(folder)
    user_id = client.user.model.id
    user_orgaos = set(client.user.orgaos)

    # Raiz é sempre legível como entrypoint de navegação.
    can_read = folder.is_root
    can_write = False

    # Órgão (grupo): só a própria pasta do órgão (subpastas têm orgao=None).
    if folder.orgao is not None and folder.orgao in user_orgaos:
        can_read = True

    # Dono da própria pasta: acesso total. NÃO herda de ancestrais — propagação
    # para subpastas só acontece via grant explícito com cascade.
    if not folder.is_root and folder.owner_user == user_id:
        can_read = True
        can_write = True

    # Grants explícitos (únicas linhas que existem) — aditivos.
    if not (can_read and can_write):
        chain_ids = [f.id for f in chain]
        perms = await FolderPermission.filter(
            user_id=user_id,
            folder_id__in=chain_ids,
        )
        for p in perms:
            applies = (p.folder_id == folder.id) or p.cascade
            if applies:
                can_read = can_read or p.can_read
                can_write = can_write or p.can_write
    return can_read, can_write


async def assert_read(client: AuthClient, folder: Folder):
    can_read, _ = await get_access(client, folder)
    if not can_read:
        raise ForbiddenException('Sem permissão de leitura nesta pasta.')


async def assert_write(client: AuthClient, folder: Folder):
    _, can_write = await get_access(client, folder)
    if not can_write:
        raise ForbiddenException('Sem permissão de escrita nesta pasta.')


def assert_admin(client: AuthClient):
    """Permite admin de estab OU superuser."""
    if not (client.user.is_super() or client.user.is_admin()):
        raise ForbiddenException('Apenas administradores.')


def assert_admin_of_estabelecimento(client: AuthClient, estabelecimento_id: UUID):
    """Superuser passa em qualquer estab; admin só no próprio."""
    if client.user.is_super():
        return
    if (
        client.user.is_admin()
        and client.estabelecimento
        and client.estabelecimento.id == estabelecimento_id
    ):
        return
    raise ForbiddenException('Apenas administradores deste estabelecimento.')
