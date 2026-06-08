from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import chamados,documentos,retorno_chamado,relatorios
from api.exception_handlers import setup_exception_handlers
from tortoise import Tortoise
from api.middleware import auth_middleware
from api.utils.limiter import limiter
from api.config import ENVIRONMENT,TORTOISE_CONFIG,NEXT_FRONTEND_URL,ALLOWED_ORIGINS_PORTAIS_PREFEITURA,ALLOWED_ORIGINS_PORTAIS_CAMARA
from contextlib import asynccontextmanager


app = FastAPI()


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

app.state.limiter = limiter
setup_exception_handlers(app)

origins = [
    'http://localhost:3000',
    NEXT_FRONTEND_URL,
    *ALLOWED_ORIGINS_PORTAIS_PREFEITURA,
    *ALLOWED_ORIGINS_PORTAIS_CAMARA,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.middleware("http")(auth_middleware)

@app.get("/")
async def read_root():
    return "Rota principal"

app.include_router(chamados.router)
app.include_router(documentos.router)
app.include_router(retorno_chamado.router)
app.include_router(relatorios.router)
