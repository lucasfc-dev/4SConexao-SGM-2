from uuid import UUID, uuid4
from typing import List
from fastapi import Request
from fastapi.routing import APIRouter
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.transactions import in_transaction

from api.models import Folder, FileObject
from api.schemas import (
    FolderIn,
    FolderOut,
    UpdatedFolder,
    FileOut,
    FolderTreeNode,
)
from api.services.auth.auth_service import AuthClient
from api.services.permissions.permission_service import (
    assert_read,
    assert_write,
    get_access,
)
from api.services.storage.r2_service import R2Service
from api.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    ForbiddenException,
)

router = APIRouter(prefix='/pastas', tags=['pastas'])


@router.get('/raiz/', response_model=FolderOut)
async def get_raiz(request: Request):
    client: AuthClient = request.state.client
    if not client.estabelecimento:
        raise BadRequestException('Usuário sem estabelecimento vinculado.')
    root = await Folder.filter(
        estabelecimento=client.estabelecimento.id, is_root=True
    ).first()
    if root is None:
        raise NotFoundException('Raiz do estabelecimento não inicializada.')
    return FolderOut.from_model(root)


@router.get('/{id}/conteudo/', response_model=FolderTreeNode)
async def get_conteudo(request: Request, id: UUID):
    client: AuthClient = request.state.client
    try:
        folder = await Folder.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    await assert_read(client, folder)
    can_read, can_write = await get_access(client, folder)

    # Breadcrumb (root → folder)
    breadcrumb_models: list[Folder] = []
    cursor: Folder = folder
    while cursor.parent_id:
        parent = await Folder.get(id=cursor.parent_id)
        breadcrumb_models.append(parent)
        cursor = parent
    breadcrumb_models.append(folder) if folder.is_root else None
    breadcrumb = list(reversed(breadcrumb_models))
    if not folder.is_root:
        breadcrumb.append(folder)

    children = await Folder.filter(parent=folder).order_by('nome')
    visible_children: list[Folder] = []
    for c in children:
        r, _ = await get_access(client, c)
        if r:
            visible_children.append(c)

    arquivos = await FileObject.filter(folder=folder).order_by('nome')

    return FolderTreeNode(
        folder=FolderOut.from_model(folder),
        breadcrumb=[FolderOut.from_model(b) for b in breadcrumb],
        subpastas=[FolderOut.from_model(c) for c in visible_children],
        arquivos=[FileOut.from_model(a) for a in arquivos],
        can_write=can_write,
    )


@router.post('/', response_model=FolderOut)
async def create_folder(request: Request, payload: FolderIn):
    client: AuthClient = request.state.client
    try:
        parent = await Folder.get(id=payload.parent_id)
    except DoesNotExist:
        raise NotFoundException('Pasta pai não encontrada.')

    await assert_write(client, parent)

    # Acesso do dono é derivado de folder.owner_user em get_access — sem semear linhas.
    try:
        folder = await Folder.create(
            id=uuid4(),
            nome=payload.nome,
            parent=parent,
            estabelecimento=parent.estabelecimento,
            is_root=False,
            owner_user=client.user.model.id,
        )
    except IntegrityError:
        raise ConflictException('Já existe uma pasta com esse nome neste local.')

    return FolderOut.from_model(folder)


@router.patch('/{id}/', response_model=FolderOut)
async def rename_folder(request: Request, id: UUID, payload: UpdatedFolder):
    client: AuthClient = request.state.client
    try:
        folder = await Folder.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    if folder.is_root:
        raise ForbiddenException('Não é permitido renomear a raiz.')

    await assert_write(client, folder)

    data = payload.model_dump(exclude_none=True)
    if not data:
        return FolderOut.from_model(folder)

    try:
        await folder.update_from_dict(data).save()
    except IntegrityError:
        raise ConflictException('Já existe uma pasta com esse nome neste local.')

    return FolderOut.from_model(folder)


@router.delete('/{id}/', response_model=FolderOut)
async def delete_folder(request: Request, id: UUID):
    client: AuthClient = request.state.client
    try:
        folder = await Folder.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    if folder.is_root:
        raise ForbiddenException('Não é permitido deletar a raiz.')

    await assert_write(client, folder)

    # Coleta todas as keys de arquivos na subárvore antes de deletar no BD.
    descendant_ids: list[UUID] = [folder.id]
    cursor_layer = [folder.id]
    while cursor_layer:
        next_layer_qs = await Folder.filter(parent_id__in=cursor_layer).values_list('id', flat=True)
        next_layer = list(next_layer_qs)
        descendant_ids.extend(next_layer)
        cursor_layer = next_layer

    keys = await FileObject.filter(folder_id__in=descendant_ids).values_list('r2_key', flat=True)

    snapshot = FolderOut.from_model(folder)
    async with in_transaction():
        await folder.delete()  # cascade no BD apaga subpastas + arquivos

    r2 = R2Service()
    await r2.delete_many(list(keys))

    return snapshot
