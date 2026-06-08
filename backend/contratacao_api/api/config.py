import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

CONN_STRING = os.getenv('CONTRATACAO_DB')

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


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

AUTH_API_URL = os.getenv('AUTH_API')

NEXT_FRONTEND_URL = os.getenv('NEXT_FRONTEND')

PDF_SERVICE_URL = os.getenv('PDF_SERVICE_URL', 'http://pdf_service:8006')

INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')
