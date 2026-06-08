from dotenv import load_dotenv
import os

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

CONN_STRING = os.getenv('OUVIDORIA_DB')

TORTOISE_CONFIG = {
    "connections": {
        "default": CONN_STRING
    },
    "apps": {
        "models": {
            "models": ["api.models","aerich.models"], 
            "default_connection": "default",
        }
    },
    "use_tz": True,  
    "timezone": "America/Sao_Paulo",  
}


AUTH_API_URL = os.getenv('AUTH_API')

EMAIL_API_URL = os.getenv('EMAIL_API')

PDF_SERVICE_URL = os.getenv('PDF_SERVICE')

INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')

NEXT_FRONTEND_URL = os.getenv('NEXT_FRONTEND')

ALLOWED_ORIGINS_PORTAIS_PREFEITURA = os.getenv('ALLOWED_ORIGINS_PORTAIS_PREFEITURA','').split(',')

ALLOWED_ORIGINS_PORTAIS_CAMARA = os.getenv('ALLOWED_ORIGINS_PORTAIS_CAMARA','').split(',')
