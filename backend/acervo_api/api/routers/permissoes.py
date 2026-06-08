from uuid import UUID, uuid4
from typing import List, Optional
from fastapi import Request, Query
from fastapi.routing import APIRouter
from tortoise.exceptions import DoesNotExist

from api.models import Folder, FolderPermission
from api.schemas import (
    PermissionIn,
    PermissionOut,
    UpdatedPermission,
    FolderUserAccessOut,
)
from api.services.auth.auth_service import AuthClient
from api.services.permissions.permission_service import (
    assert_admin,
    assert_admin_of_estabelecimento,
    get_ancestors,
)
from api.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix='/permissoes', tags=['permissoes'])


@router.post('/', response_model=PermissionOut)
async def grant_permission(request: Request, payload: PermissionIn):
    client: AuthClient = request.state.client
    assert_admin(client)

    try:
        folder = await Folder.get(id=payload.folder_id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    assert_admin_of_estabelecimento(client, folder.estabelecimento)

    existing = await FolderPermission.filter(
        folder=folder, user_id=payload.user_id
    ).first()

    if existing:
        existing.cascade = payload.cascade
        existing.can_read = payload.can_read
        existing.can_write = payload.can_write
        existing.granted_by = client.user.model.id
        await existing.save()
        return PermissionOut.from_model(existing)

    perm = await FolderPermission.create(
        id=uuid4(),
        folder=folder,
        user_id=payload.user_id,
        estabelecimento=folder.estabelecimento,
        cascade=payload.cascade,
        can_read=payload.can_read,
        can_write=payload.can_write,
        granted_by=client.user.model.id,
    )
    return PermissionOut.from_model(perm)


@router.get('/folder/{folder_id}/', response_model=List[FolderUserAccessOut])
async def list_folder_permissions(request: Request, folder_id: UUID):
    """Matriz de acesso efetivo de todos os usuários do estab à pasta.

    Calculada ao vivo (admin/dono/órgão/grant) — não há linhas materializadas para
    representar ausência de acesso. Apenas admin do próprio estab (super não acessa).
    """
    client: AuthClient = request.state.client
    assert_admin(client)

    try:
        folder = await Folder.get(id=folder_id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    assert_admin_of_estabelecimento(client, folder.estabelecimento)
    if not client.estabelecimento:
        raise BadRequestException('Admin sem estabelecimento vinculado.')

    chain = [folder] if folder.is_root else await get_ancestors(folder)
    chain_ids = [f.id for f in chain]

    perms = await FolderPermission.filter(folder_id__in=chain_ids)
    grants_by_user: dict[UUID, list[FolderPermission]] = {}
    for p in perms:
        grants_by_user.setdefault(p.user_id, []).append(p)

    users = await client.estabelecimento.get_users()
    result: list[FolderUserAccessOut] = []
    for u in users:
        uid = UUID(u['id']) if isinstance(u['id'], str) else u['id']
        nome = u.get('nome') or u.get('username') or ''
        user_orgaos = {
            (UUID(o['id']) if isinstance(o['id'], str) else o['id'])
            for o in (u.get('orgaos') or [])
        }
        user_grants = grants_by_user.get(uid, [])

        is_admin = bool(u.get('is_admin'))
        is_owner = (not folder.is_root) and folder.owner_user == uid
        orgao_read = folder.orgao is not None and folder.orgao in user_orgaos

        # Grant de ancestral com cascade (herdado, não editável aqui).
        anc_read = any(p.cascade and p.can_read for p in user_grants if p.folder_id != folder.id)
        anc_write = any(p.cascade and p.can_write for p in user_grants if p.folder_id != folder.id)

        # Camada editável: a linha de grant desta própria pasta.
        own = next((p for p in user_grants if p.folder_id == folder.id), None)
        grant_id = own.id if own else None
        grant_read = own.can_read if own else False
        grant_write = own.can_write if own else False
        grant_cascade = own.cascade if own else False

        # Herdado (trava o toggle da dimensão).
        locked_read = is_admin or is_owner or orgao_read or anc_read
        locked_write = is_admin or is_owner or anc_write
        locked_cascade = is_admin or is_owner

        can_read = locked_read or grant_read
        can_write = locked_write or grant_write
        cascade = locked_cascade or grant_cascade

        if is_admin:
            source = 'admin'
        elif is_owner:
            source = 'owner'
        elif orgao_read:
            source = 'orgao'
        elif anc_read or anc_write:
            source = 'herdado'
        elif grant_id and (grant_read or grant_write or grant_cascade):
            source = 'grant'
        else:
            source = 'none'

        result.append(FolderUserAccessOut(
            user_id=uid,
            nome=nome,
            source=source,
            can_read=can_read,
            can_write=can_write,
            cascade=cascade,
            locked_read=locked_read,
            locked_write=locked_write,
            locked_cascade=locked_cascade,
            grant_id=grant_id,
            grant_read=grant_read,
            grant_write=grant_write,
            grant_cascade=grant_cascade,
        ))
    return result


@router.get('/user/{user_id}/', response_model=List[PermissionOut])
async def list_user_permissions(
    request: Request,
    user_id: UUID,
    estabelecimento: Optional[UUID] = Query(None),
):
    client: AuthClient = request.state.client
    assert_admin(client)

    if client.user.is_super():
        if estabelecimento is None:
            raise BadRequestException(
                'Superuser deve informar ?estabelecimento=<id> para listar permissões.'
            )
        est_id = estabelecimento
    else:
        if not client.estabelecimento:
            raise BadRequestException('Admin sem estabelecimento vinculado.')
        est_id = client.estabelecimento.id

    perms = await FolderPermission.filter(
        user_id=user_id, estabelecimento=est_id
    ).order_by('created_at')
    return [PermissionOut.from_model(p) for p in perms]


@router.patch('/{id}/', response_model=PermissionOut)
async def update_permission(request: Request, id: UUID, payload: UpdatedPermission):
    client: AuthClient = request.state.client
    assert_admin(client)

    try:
        perm = await FolderPermission.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Permissão não encontrada.')

    assert_admin_of_estabelecimento(client, perm.estabelecimento)

    data = payload.model_dump(exclude_none=True)
    if data:
        await perm.update_from_dict(data).save()
    return PermissionOut.from_model(perm)


@router.delete('/{id}/', response_model=PermissionOut)
async def revoke_permission(request: Request, id: UUID):
    client: AuthClient = request.state.client
    assert_admin(client)

    try:
        perm = await FolderPermission.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Permissão não encontrada.')

    assert_admin_of_estabelecimento(client, perm.estabelecimento)

    snapshot = PermissionOut.from_model(perm)
    await perm.delete()
    return snapshot
