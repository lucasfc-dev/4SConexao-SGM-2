from uuid import UUID, uuid4
from fastapi import Request, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from tortoise.exceptions import DoesNotExist, IntegrityError

from api.models import Folder, FileObject
from api.schemas import FileOut, UpdatedFile
from api.services.auth.auth_service import AuthClient
from api.services.permissions.permission_service import assert_read, assert_write
from api.services.storage.r2_service import R2Service
from api.utils.files import get_download_headers
from api.exceptions import (
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
)

router = APIRouter(prefix='/arquivos', tags=['arquivos'])


@router.post('/', response_model=FileOut)
async def upload_file(
    request: Request,
    folder_id: UUID = Form(...),
    file: UploadFile = File(...),
):
    client: AuthClient = request.state.client
    try:
        folder = await Folder.get(id=folder_id)
    except DoesNotExist:
        raise NotFoundException('Pasta não encontrada.')

    await assert_write(client, folder)

    file_id = uuid4()
    filename = file.filename or str(file_id)

    if await FileObject.filter(folder=folder, nome=filename).exists():
        raise ConflictException('Já existe um arquivo com esse nome nesta pasta.')

    body = await file.read()
    key = R2Service.build_key(folder.estabelecimento, file_id, filename)
    content_type = file.content_type or 'application/octet-stream'

    r2 = R2Service()
    await r2.upload(key=key, body=body, content_type=content_type)

    try:
        obj = await FileObject.create(
            id=file_id,
            nome=filename,
            folder=folder,
            estabelecimento=folder.estabelecimento,
            r2_key=key,
            content_type=content_type,
            size_bytes=len(body),
            owner_user=client.user.model.id,
        )
    except IntegrityError:
        await r2.delete(key)
        raise ConflictException('Já existe um arquivo com esse nome nesta pasta.')
    except Exception as e:
        await r2.delete(key)
        raise InternalServerErrorException(f'Falha ao registrar arquivo: {e}')

    return FileOut.from_model(obj)


@router.get('/{id}/', response_model=FileOut)
async def get_file_metadata(request: Request, id: UUID):
    client: AuthClient = request.state.client
    try:
        obj = await FileObject.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Arquivo não encontrado.')

    folder = await Folder.get(id=obj.folder_id)
    await assert_read(client, folder)

    return FileOut.from_model(obj)


@router.get('/{id}/content/')
async def get_file_content(request: Request, id: UUID):
    client: AuthClient = request.state.client
    try:
        obj = await FileObject.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Arquivo não encontrado.')

    folder = await Folder.get(id=obj.folder_id)
    await assert_read(client, folder)

    r2 = R2Service()
    iterator, content_length, _ = await r2.get_stream(obj.r2_key)

    headers = get_download_headers(
        filename=obj.nome,
        content_length=content_length or obj.size_bytes,
        disposition='inline',
    )
    return StreamingResponse(iterator, media_type=obj.content_type, headers=headers)


@router.patch('/{id}/', response_model=FileOut)
async def rename_file(request: Request, id: UUID, payload: UpdatedFile):
    client: AuthClient = request.state.client
    try:
        obj = await FileObject.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Arquivo não encontrado.')

    folder = await Folder.get(id=obj.folder_id)
    await assert_write(client, folder)

    data = payload.model_dump(exclude_none=True)
    new_name = data.get('nome')
    if not new_name or new_name == obj.nome:
        return FileOut.from_model(obj)

    conflict = await FileObject.filter(
        folder_id=obj.folder_id, nome=new_name
    ).exclude(id=obj.id).exists()
    if conflict:
        raise ConflictException('Já existe um arquivo com esse nome nesta pasta.')

    old_key = obj.r2_key
    new_key = R2Service.build_key(obj.estabelecimento, obj.id, new_name)

    r2 = R2Service()
    await r2.copy(old_key, new_key)
    try:
        obj.nome = new_name
        obj.r2_key = new_key
        await obj.save()
    except IntegrityError:
        await r2.delete(new_key)
        raise ConflictException('Já existe um arquivo com esse nome nesta pasta.')
    except Exception as e:
        await r2.delete(new_key)
        raise InternalServerErrorException(f'Falha ao renomear arquivo: {e}')

    await r2.delete(old_key)
    return FileOut.from_model(obj)


@router.delete('/{id}/', response_model=FileOut)
async def delete_file(request: Request, id: UUID):
    client: AuthClient = request.state.client
    try:
        obj = await FileObject.get(id=id)
    except DoesNotExist:
        raise NotFoundException('Arquivo não encontrado.')

    folder = await Folder.get(id=obj.folder_id)
    await assert_write(client, folder)

    snapshot = FileOut.from_model(obj)
    key = obj.r2_key
    await obj.delete()

    r2 = R2Service()
    await r2.delete(key)

    return snapshot
