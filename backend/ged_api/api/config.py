from dotenv import load_dotenv
import os

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

CONN_STRING = os.getenv('GED_DB')

TORTOISE_CONFIG = {
    "connections": {
        "default": CONN_STRING
    },
    "apps": {
        "models": {
            "models": ["api.models"], 
            "default_connection": "default",
        }
    },
    "use_tz": True,  
    "timezone": "America/Sao_Paulo",  
}


AUTH_API_URL = os.getenv('AUTH_API')

DOEM_API_URL = os.getenv('DOEM_API')

PDF_SERVICE_URL = os.getenv('PDF_SERVICE')

NEXT_FRONTEND_URL = os.getenv('NEXT_FRONTEND')

ALLOWED_ORIGINS_PORTAIS_CAMARA = os.getenv('ALLOWED_ORIGINS_PORTAIS_CAMARA','').split(',')

SECRET_KEY = os.getenv('SECRET_KEY')

# Chave de API para comunicação entre serviços
INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')