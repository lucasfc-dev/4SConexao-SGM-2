# Usa a imagem base oficial do Python
FROM python:3.11-slim

RUN mkdir -p /var/log/auth_api

RUN apt-get update && apt-get install -y \
    g++ build-essential swig libffi-dev libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos do projeto para o container
COPY pyproject.toml /app
COPY poetry.lock /app
RUN pip install --upgrade pip setuptools wheel

RUN pip install poetry
# Instala todas as dependências, incluindo as de desenvolvimento
RUN poetry install 

# Copia os arquivos da aplicação para o diretório de trabalho
COPY . /app

# Expõe a porta onde o FastAPI será executado
EXPOSE 8001

# Comando para iniciar a aplicação FastAPI usando o Uvicorn
CMD ["poetry", "run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8001"]

