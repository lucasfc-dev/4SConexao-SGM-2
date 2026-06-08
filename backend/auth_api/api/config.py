import os
from dotenv import load_dotenv

load_dotenv()

CONN_STRING = os.getenv('AUTH_DB')

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

EMAIL_API_URL = os.getenv('EMAIL_API')

ACERVO_API_URL = os.getenv('ACERVO_API')

NEXT_FRONTEND_URL = os.getenv('NEXT_FRONTEND')

# Chave de API para comunicação entre serviços
INTER_SERVICE_API_KEY = os.getenv('INTER_SERVICE_API_KEY')

async def modulos_seed_initializer():
    from api.models import ModuloTransparencia
    modulos = [
        "Acordos Firmados Sem Transferências de Recursos",
        "Apreciação das Contas Pelo Tribunal de Contas",
        "Situação do Concurso Público e Seleções Públicas",
        "Lista de Aprovados em Concursos e Processos Seletivos",
        "Emendas Parlamentares",
        "Estoque de Medicamentos",
        "Lista de Medicamentos Fornecidos pelo SUS",
        "Horários dos Profissionais da Saúde",
        "Incentivos a Projetos Culturais",
        "Julgamento das Contas do Chefe do Executivo pelo Legislativo",
        "Lista de Espera Regulação",
        "Lista de Espera das Creches Municipais",
        "Lista de Estagiários",
        "Lista de Terceirizados",
        "Objetivos Estratégicos",
        "Plano Anual de Contratação (PAC)",
        "Plano para Educação e Seus Resultados",
        "Plano para Saúde e Seus Resultados",
        "Política Nacional Aldir Blanc de Fomento à Cultura",
        "Obras Paralisadas",
        "Lei Paulo Gustavo - LPG",
        "Relatório de Gestão ou Atividades",
        "Relação de Licitantes e/ou Contratados Sancionados",
        "Renúncias Fiscais",
        "Documentos e Publicações Meio Ambiente",
        "Tabela de Valores de Diárias",
        "Lista de Inscritos em Divida Ativa",
        "Transferências Recebidas Convênios",
        "Transferências Realizadas Convênios",
        "Obras",
        "Conselho Municipal de Saúde",
        "Conselho Municipal de Educação",
        "Conselho Municipal de Assistência Social",
        "Cotas Parlamentares",
    ]
    for nome in modulos:
        await ModuloTransparencia.get_or_create(nome=nome)
