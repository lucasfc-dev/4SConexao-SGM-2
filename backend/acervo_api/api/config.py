from dotenv import load_dotenv
import os

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

CONN_STRING = os.getenv('ACERVO_DB')

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

NEXT_FRONTEND_URL = os.getenv('NEXT_FRONTEND')

SECRET_KEY = os.getenv('SECRET_KEY')

INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET")
R2_ENDPOINT = os.getenv("R2_ENDPOINT")
