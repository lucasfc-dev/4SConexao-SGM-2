FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    g++ build-essential swig libffi-dev libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml /app
COPY poetry.lock /app
RUN pip install --upgrade pip setuptools wheel

RUN pip install poetry

RUN poetry install --no-interaction --no-ansi -vvv

COPY . /app

EXPOSE 8005

CMD ["poetry", "run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8005"]