from fastapi.routing import APIRouter
from fastapi import Request
from api.schemas import PacoteIn, PacoteOut, FuncIds
from api.models import Funcionalidade, Pacote, Estabelecimento
from api.exceptions import (
    NotFoundException,
    MethodNotAllowedException,
    InternalServerErrorException
)
from api.services.webhooks import acervo_webhooks
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List, Annotated


router = APIRouter(prefix='/pacote', tags=['pacotes'])

@router.post('/', response_model=PacoteOut)
async def create_pacote(request: Request, pacote: PacoteIn):
    current_user = await request.state.user
    if current_user.is_super:
        async with in_transaction("default") as connection:
            try:
                p = await Pacote.create(nome=pacote.nome, using_db=connection)
                lista_funcs = [await Funcionalidade.get(id=func_id, using_db=connection) for func_id in pacote.func_ids]
                await p.funcionalidades.add(*lista_funcs, using_db=connection)
                await p.fetch_related('funcionalidades', using_db=connection)
                return p
            except DoesNotExist:
                await connection.rollback()
                raise NotFoundException('Id de funcionalidade não encontrado')
            except Exception as e:
                await connection.rollback()
                raise InternalServerErrorException(f'Erro interno: {e}')
    raise MethodNotAllowedException('Sem permissões para esse método')

@router.get('/funcionalidades/{id}/')
async def get_pacote_funcs(request: Request, id: UUID):
    estabelecimento = await Estabelecimento.get(id=id)
    pacote = await estabelecimento.pacote
    funcionalidades = await pacote.funcionalidades.all()
    return funcionalidades


@router.patch('/{pacote_id}')
async def update_pacote(request: Request, func: FuncIds, action: str, pacote_id: UUID):
    current_user = await request.state.user
    if current_user.is_super:
        try:
            pacote = await Pacote.get(id=pacote_id)
            funcs = [await Funcionalidade.get(id=func_id) for func_id in func.func_ids]
            if action == "add":
                await pacote.funcionalidades.add(*funcs)
                # Acervo recém-ativado no pacote (1:1 com estab) -> monta a árvore.
                if any(f.nome == acervo_webhooks.ACERVO_FUNC for f in funcs):
                    estab = await Estabelecimento.get_or_none(pacote_id=pacote_id)
                    if estab is not None:
                        await acervo_webhooks.acervo_ativado(estab, current_user.id)
            elif action == "remove":
                await pacote.funcionalidades.remove(*funcs)
            else:
                return {'message': "Ação não permitida"}
            return {'message': "Ação realizada"}
        except DoesNotExist:
            raise NotFoundException('Id de funcionalidade não encontrado')
    raise MethodNotAllowedException('Sem permissões para esse método')