from __future__ import annotations
from fastapi import Request,Query
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse
from api.models import Modalidade
from api.schemas import ModalidadeIn,ModalidadeOut,UpdatedModalidade
from api.exceptions import NotFoundException
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import TYPE_CHECKING,List

if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient
router = APIRouter(prefix='/modalidade', tags=['Modalidades'])

@router.post('/',response_model=ModalidadeOut)
async def create_modalidade(request: Request, mod: ModalidadeIn):
    async with in_transaction("default") as connection:
        client:AuthClient = request.state.client
        modalidade = await Modalidade.create(
            nome=mod.nome,
            observacao=mod.observacao,
            estabelecimento=client.estabelecimento.id,
            using_db=connection
        )
        return modalidade.to_pydantic()

@router.get('/',response_model=list[ModalidadeOut])
async def get_modalidades(request:Request,relations:List[str]=Query(default=[])):
    client:AuthClient = request.state.client
    modalidades = await Modalidade.filter(estabelecimento=client.estabelecimento.id)
    if relations:
        return [await modalidade.include_relations(relations) for modalidade in modalidades]
    return [modalidade.to_pydantic() for modalidade in modalidades]

@router.get('/estabelecimento/{id}/',response_model=list[ModalidadeOut])
async def get_modalidades(id,relations:List[str]=Query(default=[])):
    modalidades = await Modalidade.filter(estabelecimento=id)
    if relations:
        return [await modalidade.include_relations(relations) for modalidade in modalidades]
    return [modalidade.to_pydantic() for modalidade in modalidades]

@router.get('/{id}/', response_model=ModalidadeOut)
async def get_modalidade(id:UUID,relations:List[str]=Query(default=[])):
    try:
        modalidade = await Modalidade.get(id=id)
        if relations:
            return await modalidade.include_relations(relations)
        return modalidade.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Modalidade não encontrada')

@router.patch('/{id}/',response_model=ModalidadeOut)
async def update_modalidade(id:UUID,updated_modalidade:UpdatedModalidade):
    try:
        modalidade = await Modalidade.get(id=id)
        await modalidade.update_from_dict(updated_modalidade.model_dump(exclude_none=True)).save()
        return modalidade.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Modalidade não encontrada')
    
@router.delete('/{id}/')
async def delete_modalidade(id:UUID):
    async with in_transaction() as connection:
        try:
            modalidade = await Modalidade.get(id=id)
            await modalidade.delete(using_db=connection)
            return JSONResponse({
                'message':f'Modalidade {modalidade.id} deletada',
                'id':str(modalidade.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Modalidade não encontrada')