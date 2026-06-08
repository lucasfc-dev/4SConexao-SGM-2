from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import diario, ged, contratacao, ouvidoria, transparencia
from api.middleware import auth_middleware
from api.config import ENVIRONMENT
from api.exception_handlers import setup_exception_handlers
import os

# Configuração da aplicação baseada no ambiente
if ENVIRONMENT == "development":
    app = FastAPI()
else:
    app = FastAPI(
        docs_url=None,     
        redoc_url=None,    
        openapi_url=None
    )

# Configura exception handlers
setup_exception_handlers(app)

# Configuração de CORS
origins = [
    'http://localhost:3000',
    os.getenv('NEXT_FRONTEND_URL', 'http://localhost:3000'),
    os.getenv('PORTAL_PREFEITURA_URL', ''),
    'https://sgm-hml.4sconexaoetecnologia.com.br'
]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.middleware("http")(auth_middleware)

# Inclui os routers
app.include_router(diario.router)
app.include_router(ged.router)
app.include_router(contratacao.router)
app.include_router(ouvidoria.router)
app.include_router(transparencia.router)

@app.get("/")
async def read_root():
    return "Rota principal"

