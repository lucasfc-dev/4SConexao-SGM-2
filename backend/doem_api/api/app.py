from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import diario, docs
from api.middlewares import auth_middleware
from api.config import ENVIRONMENT, TORTOISE_CONFIG, NEXT_FRONTEND_URL,ALLOWED_ORIGINS_PORTAIS_CAMARA,ALLOWED_ORIGINS_PORTAIS_PREFEITURA
from api.exception_handlers import setup_exception_handlers
from tortoise import Tortoise
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(ENVIRONMENT)
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
    *ALLOWED_ORIGINS_PORTAIS_PREFEITURA,
    *ALLOWED_ORIGINS_PORTAIS_CAMARA,
]

setup_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)
app.middleware('http')(auth_middleware)

app.include_router(docs.router)
app.include_router(diario.router)


@app.get('/')
async def root():
    return 'Rota Principal'