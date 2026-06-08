import os
import time

# Configura timezone para São Paulo (UTC-3)
os.environ['TZ'] = 'America/Sao_Paulo'
if hasattr(time, 'tzset'):
    time.timezone = -3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.middleware import auth_middleware
from api.config import ENVIRONMENT,TORTOISE_CONFIG,NEXT_FRONTEND_URL, ALLOWED_ORIGINS_PORTAIS_CAMARA, ALLOWED_ORIGINS_PORTAIS_PREFEITURA
from api.routers import (
    publicacao_simples,
    doc_numerado,
    renuncia_fiscal,
    aprovado_concurso,
    medicamento_sus,
    emenda_parlamentar,
    julgamento_contas_executivo,
    concurso_publico,
    apreciacao_contas,
    obras_paralisadas,
    transferencia_recebida_convenio,
    transferencia_realizada_convenio,
    obra,
)
from api.exception_handlers import setup_exception_handlers
from tortoise import Tortoise
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app:FastAPI):
    await Tortoise.init(config=TORTOISE_CONFIG)
    await Tortoise.generate_schemas()  
    yield
    await Tortoise.close_connections()

if ENVIRONMENT == "development":
    app = FastAPI(lifespan=lifespan)
else:
    app = FastAPI(
        docs_url=None,     
        redoc_url=None,    
        openapi_url=None,
        lifespan=lifespan
    )

origins = [
    'http://localhost:3000',
    NEXT_FRONTEND_URL,
    *ALLOWED_ORIGINS_PORTAIS_CAMARA,
    *ALLOWED_ORIGINS_PORTAIS_PREFEITURA,
    'https://sgm-hml.4sconexaoetecnologia.com.br',
    'http://localhost:1337'
]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

setup_exception_handlers(app)

app.middleware('http')(auth_middleware)

app.include_router(publicacao_simples.router)
app.include_router(doc_numerado.router)
app.include_router(renuncia_fiscal.router)
app.include_router(aprovado_concurso.router)
app.include_router(medicamento_sus.router)
app.include_router(emenda_parlamentar.router)
app.include_router(julgamento_contas_executivo.router)
app.include_router(concurso_publico.router)
app.include_router(apreciacao_contas.router)
app.include_router(obras_paralisadas.router)
app.include_router(transferencia_recebida_convenio.router)
app.include_router(transferencia_realizada_convenio.router)
app.include_router(obra.router)

@app.get('/')
async def root():
    return 'Rota principal'

