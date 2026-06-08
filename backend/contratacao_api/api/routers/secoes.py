from __future__ import annotations
from fastapi import Request,Query
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse
from api.schemas import SecaoIn, SecaoOut,UpdatedSecao
from api.models import Secao,Pessoa
from api.exceptions import NotFoundException
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from typing import TYPE_CHECKING,List
from uuid import UUID

if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

router = APIRouter(prefix='/secao', tags=['Seções'])

@router.post('/', response_model=SecaoOut)
async def create_secao(request:Request,sec: SecaoIn):
    try:
        async with in_transaction("default") as connection:    
            client:AuthClient = request.state.client
            responsavel = await Pessoa.get(id=sec.responsavel)
            secao = await Secao.create(
                orgao=sec.orgao,
                nome=sec.nome,
                responsavel=responsavel,
                estabelecimento=client.estabelecimento.id,
                using_db=connection
            )
            return secao.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Pessoa não encontrada')
    
@router.get('/',response_model=List[SecaoOut])
async def get_secoes(request:Request,relations:List[str]=Query(default=[])):
    client:AuthClient = request.state.client
    orgaos_ids = client.user.orgaos
    secoes = await Secao.filter(orgao__in=orgaos_ids)
    if relations:
        client = request.state.client if 'orgao' in relations else None
        return [await secao.include_relations(relations,client) for secao in secoes]
    return [secao.to_pydantic() for secao in secoes]

@router.get('/estabelecimento/{id}/', response_model=List[SecaoOut])
async def get_secoes_por_estabelecimento(request:Request, id:UUID, relations:List[str]=Query(default=[])):
    secoes = await Secao.filter(estabelecimento=id)
    if relations:
        return [await secao.include_relations(relations) for secao in secoes]
    return [secao.to_pydantic() for secao in secoes]

@router.get('/{id}/', response_model=SecaoOut)
async def get_secao(request:Request,id:UUID,relations:List[str]=Query(default=[])):
    try:
        client:AuthClient = request.state.client
        secao = await Secao.get(id=id)
        if relations:
            client = request.state.client if 'orgao' in relations else None
            return secao.include_relations(relations,client)
        return secao.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Seção não encontrada')
    
@router.patch('/{id}/',response_model=SecaoOut)
async def update_secao(id:UUID,updated_secao:UpdatedSecao):    
    try:
        secao = await Secao.get(id=id)
    except DoesNotExist:    
        raise NotFoundException('Seção não encontrada')
    updated_dict = updated_secao.model_dump(exclude_none=True)
    if 'responsavel' in updated_dict:
        try:
            responsavel = await Pessoa.get(id=updated_dict['responsavel'])
        except DoesNotExist:
            raise NotFoundException('Pessoa não encontrada')
        updated_dict['responsavel'] = responsavel
    await secao.update_from_dict(updated_dict).save()
    return secao.to_pydantic()

    
    
@router.delete('/{id}/')
async def delete_secao(id:UUID):
    try:
        async with in_transaction() as connection:
            secao = await Secao.get(id=id)
            await secao.delete(using_db=connection)
            return JSONResponse({
                'message':f'Seção {secao.id} deletada',
                'id':str(secao.id)
            },status_code=200)
    except DoesNotExist:
        raise NotFoundException('Seção não encontrada')