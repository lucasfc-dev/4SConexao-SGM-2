from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from tortoise import Tortoise
from fastapi.middleware.cors import CORSMiddleware
from api.routers import (
    modalidades,
    pessoas,
    secoes,
    docs,
    licitacoes,
    dispensas,
    edital,
    contrato,
    fiscal_contrato,
    vigencia,
    relatorios,
    comissao,
    membro_comissao,
    fiscalizacao_contrato,
)
from api.middlewares import auth_middleware
from api.config import ENVIRONMENT,TORTOISE_CONFIG, NEXT_FRONTEND_URL
from api.exception_handlers import setup_exception_handlers
from api.utils.scheduler import scheduler
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app:FastAPI):
    await Tortoise.init(config=TORTOISE_CONFIG)
    await Tortoise.generate_schemas()  
    scheduler.start()
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
    

origins = ['http://localhost:3000', NEXT_FRONTEND_URL, 'https://sgm-hml.4sconexaoetecnologia.com.br']
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

setup_exception_handlers(app)

app.middleware("http")(auth_middleware)

app.include_router(modalidades.router)
app.include_router(pessoas.router)
app.include_router(secoes.router)
app.include_router(docs.router)
app.include_router(licitacoes.router)
app.include_router(dispensas.router)
app.include_router(edital.router)
app.include_router(comissao.router)
app.include_router(contrato.router)
app.include_router(fiscal_contrato.router)
app.include_router(vigencia.router)
app.include_router(relatorios.router)
app.include_router(membro_comissao.router)
app.include_router(fiscalizacao_contrato.router)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exception: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exception)}
    )

@app.get("/")
async def root():
    return 'Rota principal'

