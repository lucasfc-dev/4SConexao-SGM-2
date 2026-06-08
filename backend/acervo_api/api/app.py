from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from tortoise import Tortoise

from api.middleware import auth_middleware
from api.routers import pastas, arquivos, permissoes, webhooks
from api.config import ENVIRONMENT, TORTOISE_CONFIG, NEXT_FRONTEND_URL
from api.exception_handlers import setup_exception_handlers


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
        lifespan=lifespan,
    )

setup_exception_handlers(app)

origins = [
    'http://localhost:3000',
    NEXT_FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.middleware('http')(auth_middleware)

app.include_router(pastas.router)
app.include_router(arquivos.router)
app.include_router(permissoes.router)
app.include_router(webhooks.router)


@app.get('/')
async def root():
    return 'Rota principal'
