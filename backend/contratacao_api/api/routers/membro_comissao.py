from __future__ import annotations
from fastapi import Request, Query
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse
from tortoise.transactions import in_transaction
from api.models import MembroComissao, ComissaoLicitacao, Pessoa
from api.schemas import MembroComissaoIn, MembroComissaoOut, UpdatedMembroComissao
from api.exceptions import NotFoundException
from tortoise.exceptions import DoesNotExist
from typing import List, Union, TYPE_CHECKING
from uuid import UUID

if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

router = APIRouter(prefix='/membro_comissao', tags=['Membros da Comissão'])

@router.post('/', response_model=MembroComissaoOut)
async def create_membro_comissao(request: Request, membro: MembroComissaoIn):
    async with in_transaction("default") as connection:
        client: AuthClient = request.state.client
        
        try:
            comissao = await ComissaoLicitacao.get(id=membro.comissao)
        except DoesNotExist:
            raise NotFoundException('Comissão não encontrada')
        
        try:
           pessoa = await Pessoa.get(id=membro.pessoa)
        except DoesNotExist:
            raise NotFoundException('Pessoa não encontrada')
        
        membro_comissao = await MembroComissao.create(
            comissao=comissao,
            pessoa=pessoa,
            atribuicao=membro.atribuicao,
            cargo=membro.cargo,
            natureza_cargo=membro.natureza_cargo if membro.natureza_cargo else None,
            ato_pessoal=membro.ato_pessoal,
            vigencia_inicial=membro.vigencia_inicial,
            vigencia_final=membro.vigencia_final if membro.vigencia_final else None,
            estabelecimento=client.estabelecimento.id,
            using_db=connection
        )
        return membro_comissao.to_pydantic()

@router.get('/', response_model=List[MembroComissaoOut])
async def get_membros_comissao(request: Request, relations: List[str] = Query(default=[])):
    client: AuthClient = request.state.client
    membros = await MembroComissao.filter(estabelecimento=client.estabelecimento.id)
    
    if relations:
        return [await membro.include_relations(relations, client) for membro in membros]
    return [membro.to_pydantic() for membro in membros]

@router.get('/{id}/', response_model=MembroComissaoOut)
async def get_membro_comissao(request: Request, id: UUID, relations: List[str] = Query(default=[])):
    client: AuthClient = request.state.client
    try:
        membro = await MembroComissao.get(id=id, estabelecimento=client.estabelecimento.id)
        if relations:
            return await membro.include_relations(relations, client)
        return membro.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Membro da comissão não encontrado')

@router.get('/comissao/{comissao_id}/', response_model=List[MembroComissaoOut])
async def get_membros_by_comissao(request: Request, comissao_id: UUID, relations: List[str] = Query(default=[])):
    """Buscar todos os membros de uma comissão específica"""
    client: AuthClient = request.state.client
    
    # Verificar se a comissão existe
    try:
        await ComissaoLicitacao.get(id=comissao_id, estabelecimento=client.estabelecimento.id)
    except DoesNotExist:
        raise NotFoundException('Comissão não encontrada')
    
    membros = await MembroComissao.filter(
        comissao_id=comissao_id, 
        estabelecimento=client.estabelecimento.id
    )
    
    if relations:
        return [await membro.include_relations(relations, client) for membro in membros]
    return [membro.to_pydantic() for membro in membros]

@router.patch('/{id}/', response_model=MembroComissaoOut)
async def update_membro_comissao(request: Request, id: UUID, updated_membro: UpdatedMembroComissao):
    client: AuthClient = request.state.client
    async with in_transaction("default") as connection:
        try:
            membro = await MembroComissao.get(id=id, estabelecimento=client.estabelecimento.id)
            
            # Verificar se a nova comissão existe (se fornecida)
            if updated_membro.comissao:
                try:
                    await ComissaoLicitacao.get(id=updated_membro.comissao, estabelecimento=client.estabelecimento.id)
                except DoesNotExist:
                    raise not_found_comissao
            
            # Verificar se a nova pessoa existe (se fornecida)
            if updated_membro.pessoa:
                try:
                    await Pessoa.get(id=updated_membro.pessoa, estabelecimento=client.estabelecimento.id)
                except DoesNotExist:
                    raise not_found_pessoa
            
            await membro.update_from_dict(updated_membro.model_dump(exclude_none=True)).save(using_db=connection)
            return membro.to_pydantic()
        except DoesNotExist:
            raise not_found_membro

@router.delete('/{id}/')
async def delete_membro_comissao(request: Request, id: UUID):
    client: AuthClient = request.state.client
    async with in_transaction("default") as connection:
        try:
            membro = await MembroComissao.get(id=id, estabelecimento=client.estabelecimento.id)
            await membro.delete(using_db=connection)
            return JSONResponse({
                'message': f'Membro da comissão {membro.id} deletado',
                'id': str(membro.id)
            }, status_code=200)
        except DoesNotExist:
            raise not_found_membro