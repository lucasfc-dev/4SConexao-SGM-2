# Usa a imagem base oficial do Python
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    g++ build-essential swig libffi-dev libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
# Define o diretório de trabalho dentro do container

RUN apt update && apt install -y libreoffice-core libreoffice-writer libreoffice-common

WORKDIR /app

# Copia os arquivos do projeto para o container
COPY pyproject.toml /app
COPY poetry.lock /app
RUN pip install --upgrade pip setuptools wheel

RUN pip install poetry
# Instala todas as dependências, incluindo as de desenvolvimento

RUN poetry install --no-interaction --no-ansi -vvv

# Copia os arquivos da aplicação para o diretório de trabalho
COPY . /app

# Expõe a porta onde o FastAPI será executado
EXPOSE 8006

# Comando para iniciar a aplicação FastAPI usando o Uvicorn
CMD ["poetry", "run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8006"]
