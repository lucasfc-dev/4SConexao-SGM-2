from typing import List
from uuid import UUID
from api.services.auth.auth_service import AuthClient
from fastapi import Request
from fastapi.routing import APIRouter
from api.models import Tipo
from api.schemas import TipoIn,TipoOut,UpdatedTipo, UserOut
from api.exceptions import NotFoundException, InternalServerErrorException
from tortoise.exceptions import DoesNotExist

router = APIRouter(prefix='/tipo',tags=['tipo'])

@router.post('/',response_model=TipoOut)
async def create_tipo(request:Request,t:TipoIn):
    try:
        client:AuthClient = request.state.client
        tipo = await Tipo.create(nome=t.nome,descricao=t.descricao,estabelecimento=client.estabelecimento.id)
        return tipo
    except Exception as e:
        raise InternalServerErrorException(f'{e}')
    
@router.get('/',response_model=List[TipoOut])
async def get_tipos(request:Request):
    client:AuthClient = request.state.client
    tipos = await Tipo.filter(estabelecimento=client.estabelecimento.id)
    return tipos

@router.get('/{id}/',response_model=TipoOut)
async def get_tipo(request:Request,id:UUID):
    try:
        tipo = await Tipo.get(id=id)
        return tipo
    except DoesNotExist:
        raise NotFoundException('Id de Tipo não encontrado.')

@router.patch('/{id}/',response_model=TipoOut)
async def update_tipo(request:Request,id:UUID,updated_tipo:UpdatedTipo):
    try:
        tipo = await Tipo.get(id=id)
        await tipo.update_from_dict(updated_tipo.model_dump(exclude_none=True)).save()
        return tipo
    except DoesNotExist:
        raise NotFoundException('Id de Tipo não encontrado.')        

@router.delete('/{id}/',response_model=TipoOut)
async def delete_tipo(request:Request,id:UUID):
    try:
        tipo = await Tipo.get(id=id)
        await tipo.delete()
        return tipo
    except DoesNotExist:
        raise NotFoundException('Id de Tipo não encontrado.')        
    
@router.get('/estabelecimento/{estabelecimento_id}/')
async def get_doc_by_estabelecimento(estabelecimento_id:UUID):
    tipos = await Tipo.filter(estabelecimento=estabelecimento_id)
    return tipos