import os 
from dotenv import load_dotenv

load_dotenv()

# Configurações do ambiente
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FONTS_DIR = os.path.join(BASE_DIR,'files','fonts')

DATA_DIR = os.path.join(BASE_DIR,'files','data')

# URLs das APIs
AUTH_API_URL = os.getenv('AUTH_API')

DOEM_API_URL = os.getenv('DOEM_API')

SECRET_KEY = os.getenv('SECRET_KEY')

# Chave de API para comunicação entre serviços
INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')