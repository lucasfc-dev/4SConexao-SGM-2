from jwt import encode,decode,DecodeError, ExpiredSignatureError
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from cryptography.fernet import Fernet
from api.models import User
from api.schemas import TokenData
from api.config import INTER_SERVICE_API_KEY
from api.exceptions import InvalidTokenException
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from typing import Annotated
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 4
pwd_context = PasswordHash.recommended()
cipher = Fernet(SECRET_KEY)

def get_password_hash(password:str):
    return pwd_context.hash(password)

def verify_password(plain_password:str,hashed_password:str):
    return pwd_context.verify(plain_password,hashed_password)

def create_access_token(data:dict):
    to_enconde = data.copy()
    expire = datetime.now(tz=ZoneInfo('UTC')) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_enconde.update({'exp': expire})
    encoded_jwt = encode(to_enconde,SECRET_KEY,algorithm=ALGORITHM)
    return {"token":encoded_jwt,"exp":expire}

def encrypt_password(password: str) -> str:
    return cipher.encrypt(password.encode()).decode()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

T_token = Annotated[str,Depends(oauth2_scheme)]

async def get_current_user(token:T_token):
    try:
        payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        token_data = TokenData(username=username)
        user = await User.get(username=token_data.username)
        if user:
            return user
        raise InvalidTokenException('Usuário não encontrado')
    except DecodeError:
        raise InvalidTokenException("Token inválido")
    except ExpiredSignatureError:
        raise InvalidTokenException('Token expirado')

def verify_api_key(x_api_key: str):
    return x_api_key == INTER_SERVICE_API_KEY