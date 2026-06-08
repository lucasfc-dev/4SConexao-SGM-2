from fastapi.routing import APIRouter
from fastapi import Depends, Request
from api.schemas import FuncionalidadeOut
from api.models import Funcionalidade, User
from api.exceptions import (
    InternalServerErrorException,
    MethodNotAllowedException,
    NotFoundException
)
from typing import List
from tortoise.exceptions import DoesNotExist

router = APIRouter(prefix='/funcionalidade', tags=['funcionalidades'])

@router.get('/all/', response_model=List[FuncionalidadeOut])
async def get_all_funcs(request: Request):
    funcionalidades = await Funcionalidade.all()
    return funcionalidades

@router.get('/{id}/', response_model=FuncionalidadeOut)
async def get_func(request: Request, id: int):
    try:
        func = await Funcionalidade.get(id=id)
        return func
    except DoesNotExist:
        raise NotFoundException('Id de Funcionalidade não encontrado')
    except Exception as e:
        raise InternalServerErrorException(f'Erro de servidor: {e}')

@router.delete('/{id}/')
async def delete_func(request: Request, id: int):
    current_user: User = await request.state.user
    if current_user.is_super:
        try:
            func = await Funcionalidade.get(id=id)
            func_id = func.id
            await func.delete()
            return {'message': f'Função de id {func_id} deletada com sucesso'}   
        except DoesNotExist:
            raise NotFoundException('Id de Funcionalidade não encontrado')
        except Exception as e:
            raise InternalServerErrorException(f'Erro de servidor: {e}')
    raise MethodNotAllowedException('Sem permissões para esse método')  
        
