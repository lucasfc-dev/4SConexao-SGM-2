from fastapi.routing import APIRouter
from fastapi import Depends, Request, Response
from api.schemas import (
    UserIn,
    UserOut,
    UptadedUser,
    SuperUserOut,
    EmailIn,
    EmailOut,
    TokenResetIn,
    PassWordIn,
    ServerEstabelecimentoOut,
    ServerUserOut,
    OrgaoRefOut,
    FuncionalidadeOut
)
from api.models import Funcionalidade, User, Orgao, Funcionalidade, Estabelecimento, TokenReset
from api.security import get_password_hash, create_access_token
from api.config import EMAIL_API_URL
from api.exceptions import (
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    MethodNotAllowedException,
    InternalServerErrorException
)
from tortoise.expressions import Q
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
import requests
from datetime import datetime, timedelta
import pytz
from typing import List, Union

router = APIRouter(prefix='/user',tags=['user'])

@router.get('/me/', response_model=Union[UserOut, SuperUserOut])
async def get_current_user(request:Request, response:Response):
    current_user = await request.state.user
    await current_user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
    return current_user

@router.get('/server/me/',response_model=ServerUserOut)
async def get_current_server_user(request: Request, response: Response):
    current_user = await request.state.user
    await current_user.fetch_related('estabelecimento')

    estabelecimento_pydantic = ServerEstabelecimentoOut.model_validate(current_user.estabelecimento)

    user_out = ServerUserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        cpf=current_user.cpf,
        nome=current_user.nome,
        cargo=current_user.cargo,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        estabelecimento=estabelecimento_pydantic,
        orgaos=[OrgaoRefOut(id=orgao.id, nome=orgao.nome) for orgao in await current_user.orgaos.all()],
        funcionalidades=[FuncionalidadeOut(id=func.id, nome=func.nome) for func in await current_user.funcionalidades.all()]
    )
    return user_out

@router.get('/{user_id}/', response_model=UserOut)
async def get_user(request:Request, user_id:UUID):
    try:
        user = await User.get(id=user_id)
        await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
        return user
    except DoesNotExist:
        raise NotFoundException("Usuário não encontrado")
    
@router.get('/all/estabelecimento/', response_model=List[UserOut])
async def get_all_users_estabelecimento(request:Request):
    current_user = await request.state.user
    estabelecimento = await current_user.estabelecimento
    users = await estabelecimento.users.all().prefetch_related('estabelecimento', 'funcionalidades', 'orgaos')
    return users

@router.post('/', status_code=201, response_model=UserOut)
async def create_user(request: Request, user: UserIn):
    current_user = await request.state.user

    db_user = await User.get_or_none(Q(username=user.username) | Q(email=user.email))
    if db_user:
        if db_user.username == user.username:
            raise BadRequestException("Nome de usuário já existe")
        elif db_user.email == user.email:
            raise BadRequestException("Email já cadastrado em outra conta")

    try:
        estabelecimento = await Estabelecimento.get(id=user.estabelecimento).prefetch_related('pacote__funcionalidades')
    except DoesNotExist:
        raise NotFoundException("Id de estabelecimento não existe")

    if user.is_admin and not current_user.is_super:
        raise UnauthorizedException("Sem permissões para criar administradores")
    
    if current_user.is_admin == False and current_user.is_super == False:
        raise UnauthorizedException("Sem permissões para criar usuário")
    
    hashed_password = get_password_hash(user.password)

    
    async with in_transaction() as connection:
        orgaos = [await Orgao.get(id=orgao_id) for orgao_id in user.orgaos_ids]
        
        # Se funcionalidades_ids não for informado, copia todas do pacote
        if user.funcionalidades_ids is None or len(user.funcionalidades_ids) == 0:
            funcionalidades = await estabelecimento.pacote.funcionalidades.all()
        else:
            funcionalidades = [await Funcionalidade.get(id=func_id) for func_id in user.funcionalidades_ids]
            for func in funcionalidades:
                if func not in estabelecimento.pacote.funcionalidades:
                    raise BadRequestException(f'Funcionalidade {func.nome} não disponível no pacote do estabelecimento')
        
        try:
            db_user = await User.create(
                username=user.username,
                email=user.email,
                password=hashed_password,
                nome=user.nome,
                cpf=user.cpf,
                cargo=user.cargo,
                is_super=False,
                is_admin=user.is_admin,
                estabelecimento=estabelecimento,
                using_db=connection
            )
            await db_user.orgaos.add(*orgaos,using_db=connection)
            await db_user.funcionalidades.add(*funcionalidades,using_db=connection)
            await db_user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos', using_db=connection)
            return db_user
        except Exception as e:
            raise InternalServerErrorException(f"Erro ao criar usuário: {str(e)}")

@router.post('/super_user/',response_model=SuperUserOut)
async def create_super_user(request:Request,user:UserIn):
    current_user = request.state.user
    if current_user.is_super:
        db_user = await User.get_or_none(Q(username=user.username) | Q(email=user.email))
        if db_user is not None:
            if db_user.username == user.username:
                raise BadRequestException("Nome de usuário já existe")
            elif db_user.email == user.email:
                raise BadRequestException("Email já cadastrado em outra conta")
        else:
            hashed_password = get_password_hash(user.password)
            super_user = await User.create(
                username=user.username,
                email=user.email,
                password=hashed_password,
                cargo=user.cargo,
                is_super=True,
            )
            return super_user                          
    else:
        raise UnauthorizedException("Sem permissões")

@router.patch('/{user_id}/', response_model=Union[UserOut, SuperUserOut])
async def update_user_fields(request:Request,user_id:UUID,updated_user:UptadedUser):
    try:
        current_user:User = await request.state.user
        if current_user.id == user_id or current_user.is_admin or current_user.is_super:
            user = await User.get(id=user_id)
            await user.update_from_dict(updated_user.model_dump(exclude_none=True)).save()
            await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
            return user
        else:
            raise MethodNotAllowedException('Sem permissões para atualizar usuário')
    except Exception as e:
        raise InternalServerErrorException(f'Erro ao atualizar usuário: {e}')

@router.patch('/change_password/ok/')
async def change_password(request:Request,password:PassWordIn):
    try:
        current_user = await request.state.user
        hashed_password = get_password_hash(password.password)
        current_user.password = hashed_password
        await current_user.save()
        return {'message':'senha alterada'}
    except Exception as e:
        raise e

@router.patch('/{user_id}/add_orgao/{orgao_id}/', response_model=UserOut)
async def add_orgao(request:Request,user_id:UUID,orgao_id:UUID):
    try:
        current_user = await request.state.user
        if current_user.is_admin or current_user.is_super:
            user = await User.get(id=user_id).prefetch_related('estabelecimento')
            orgao = await Orgao.get(id=orgao_id)
            if orgao.estabelecimento_id == user.estabelecimento_id:
                await user.orgaos.add(orgao)
                await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
                return user
            else:
                raise BadRequestException('Órgão não pertence ao mesmo estabelecimento do usuário')
        else:
            raise ForbiddenException('Not enough permissions')
    except DoesNotExist:
        raise NotFoundException('Id de usuário ou órgão não existe')
    except Exception as e:
        raise InternalServerErrorException(f'Erro ao adicionar órgão: {e}')
    
@router.patch('/{user_id}/remove_orgao/{orgao_id}/', response_model=UserOut)
async def remove_orgao(request:Request,user_id:UUID,orgao_id:UUID):
    try:
        current_user = await request.state.user
        if current_user.is_admin or current_user.is_super:
            user = await User.get(id=user_id).prefetch_related('orgaos')
            orgao = await Orgao.get(id=orgao_id)
            await user.orgaos.remove(orgao)
            await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
            return user
        else:
            raise ForbiddenException('Not enough permissions')
    except DoesNotExist:
        raise NotFoundException('Id de usuário ou órgão não existe')
    except Exception as e:
        raise InternalServerErrorException(f'Erro ao remover órgão: {e}')

@router.patch('/{user_id}/add_funcionalidade/{funcionalidade_id}/', response_model=UserOut)
async def add_funcionalidade(request:Request,user_id:UUID,funcionalidade_id:int):
    try:
        current_user = await request.state.user
        if current_user.is_admin or current_user.is_super:
            user = await User.get(id=user_id).prefetch_related('estabelecimento__pacote__funcionalidades')
            estabelecimento_funcs= await user.estabelecimento.pacote.funcionalidades
            funcionalidade = await Funcionalidade.get(id=funcionalidade_id)
            if funcionalidade in estabelecimento_funcs:
                await user.funcionalidades.add(funcionalidade)
                await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
                return user
            else:
                raise BadRequestException('Funcionalidade não disponível no pacote do estabelecimento')
        else:
            raise ForbiddenException('Not enough permissions')
    except DoesNotExist:
        raise NotFoundException('Id de usuário ou funcionalidade não existe')
    except Exception as e:
        raise InternalServerErrorException(f'Erro ao adicionar funcionalidade: {e}')
    
@router.patch('/{user_id}/remove_funcionalidade/{funcionalidade_id}/', response_model=UserOut)
async def remove_funcionalidade(request:Request,user_id:UUID,funcionalidade_id:int):
    try:
        current_user = await request.state.user
        if current_user.is_admin or current_user.is_super:
            user = await User.get(id=user_id).prefetch_related('funcionalidades')
            funcionalidade = await Funcionalidade.get(id=funcionalidade_id)
            await user.funcionalidades.remove(funcionalidade)
            await user.fetch_related('estabelecimento', 'funcionalidades', 'orgaos')
            return user
        else:
            raise ForbiddenException('Not enough permissions')
    except DoesNotExist:
        raise NotFoundException('Id de usuário ou funcionalidade não existe')
    except Exception as e:
        raise InternalServerErrorException(f'Erro ao remover funcionalidade: {e}')

@router.delete('/{user_id}/', status_code=200, response_model=Union[UserOut, SuperUserOut])
async def delete_user(request:Request,user_id:UUID) :
    current_user = await request.state.user
    if current_user.is_admin or current_user.is_super:
        try:
            user = await User.get(id=user_id)
            await user.delete()
            return user
        except DoesNotExist:
            raise NotFoundException('Id de usuário não existe')
    else:
        raise ForbiddenException('Not enough permissions')

fuso_horario = pytz.timezone('America/Sao_Paulo')

@router.post('/password_reset/')
async def reset_my_password(email:EmailIn):
    try:
        user = await User.get(email=email.email_address)
        token = await TokenReset.get_or_none(user=user)
        if token is None:
            token = await TokenReset.create(user=user,expires_at=datetime.now(fuso_horario)+timedelta(minutes=15))
            email_out = EmailOut(email=user.email,subject='Recuperação de senha',keys={'token':str(token.id)})
            response = requests.post(url=f'{EMAIL_API_URL}/email/password/',json=email_out.model_dump())
            return response.json()
        else:
            await token.delete()
            email = EmailIn(email_address=user.email)
            return await reset_my_password(email=email)
    except DoesNotExist:
        raise NotFoundException('Email não vinculado a nenhum usuário')
    except Exception as e:
        raise e


@router.post('/check_reset_token/')
async def get_user_by_token(request:Request,token:TokenResetIn):
    try:
        token_model = await TokenReset.get(id=token.token_id)
        if datetime.now(fuso_horario) < token_model.expires_at: 
            user = await token_model.user
            access_token = create_access_token({"sub":user.username})
            await token_model.delete()
            return {"access_token":access_token}
        else:
            await token_model.delete()
            raise UnauthorizedException('Token expirado')
    except DoesNotExist:
        raise NotFoundException('Token inválido')
    except Exception as e:
        raise e
    
