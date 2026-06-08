from fastapi.routing import APIRouter
from fastapi import Depends, Request, Header
from fastapi.security import OAuth2PasswordRequestForm
from api.models import User
from api.security import verify_password, create_access_token, verify_api_key
from api.exceptions import UnauthorizedException, BadRequestException, InvalidAPIKeyException
from typing import Annotated
from tortoise.exceptions import DoesNotExist

router = APIRouter(prefix='/auth', tags=['auth'])

T_OAuth = Annotated[OAuth2PasswordRequestForm, Depends()]

@router.post('/token/')
async def get_token(form_data: T_OAuth):
    try:
        db_user = await User.get(username=form_data.username)
        if verify_password(form_data.password, db_user.password):
            access_token = create_access_token(data={"sub": form_data.username})
            return {'access_token': access_token, 'token_type': 'bearer'}
        else:
            raise UnauthorizedException("Invalid password")
    except DoesNotExist:       
        raise BadRequestException("Nome de usuário não existe")
       
@router.get('/validate-api-key/')
async def verify_api_key_endpoint(x_api_key: str = Header(...)):
    if verify_api_key(x_api_key):
        return {"valid": True}
    else:
        raise InvalidAPIKeyException("Chave de API inválida")