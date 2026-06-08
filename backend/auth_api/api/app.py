from fastapi import FastAPI
from tortoise import Tortoise
from fastapi.middleware.cors import CORSMiddleware
from api.middlewares import AuthRequestMiddleware
from api.config import TORTOISE_CONFIG, NEXT_FRONTEND_URL, modulos_seed_initializer
from api.exceptions import *
from api.exception_handlers import setup_exception_handlers
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await Tortoise.init(config=TORTOISE_CONFIG)
    await Tortoise.generate_schemas()  
    await modulos_seed_initializer()
    yield
    await Tortoise.close_connections()

app = FastAPI(lifespan=lifespan)

# Register exception handlers
setup_exception_handlers(app)

origins = ['http://localhost:3000', NEXT_FRONTEND_URL, 'https://sgm-hml.4sconexaoetecnologia.com.br']
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.add_middleware(AuthRequestMiddleware)

from api.routers import (
    estabelecimentos,
    users,
    auth, 
    pacotes,
    orgaos,
    funcionalidades,
    pacotes_transparencia
)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(estabelecimentos.router)
app.include_router(pacotes.router)
app.include_router(funcionalidades.router)
app.include_router(orgaos.router)
app.include_router(pacotes_transparencia.router)

@app.get("/")
async def root():
    return "Rota principal"