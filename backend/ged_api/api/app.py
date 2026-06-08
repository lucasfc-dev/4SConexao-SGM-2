from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.middleware import auth_middleware
from api.routers import docs, vereador, tipo, relatorio, docmodels, statistics
from api.config import ENVIRONMENT, TORTOISE_CONFIG, NEXT_FRONTEND_URL, ALLOWED_ORIGINS_PORTAIS_CAMARA
from api.exception_handlers import setup_exception_handlers
from tortoise import Tortoise
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
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

# Configure exception handlers
setup_exception_handlers(app)

origins = [
    'http://localhost:3000',
    NEXT_FRONTEND_URL,
    'https://sgm-hml.4sconexaoetecnologia.com.br',
    'http://localhost:1337'
]+[origin for origin in ALLOWED_ORIGINS_PORTAIS_CAMARA]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.middleware('http')(auth_middleware)

app.include_router(docs.router)
app.include_router(vereador.router)
app.include_router(tipo.router)
app.include_router(relatorio.router)
app.include_router(docmodels.router)
app.include_router(statistics.router)

@app.get('/')
async def root():
    return 'Rota principal'

