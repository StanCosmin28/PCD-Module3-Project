FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
COPY ml-pipeline/requirements.txt /app/ml-pipeline/requirements.txt
RUN pip install -r /app/backend/requirements.txt \
    && pip install -r /app/ml-pipeline/requirements.txt

COPY backend /app/backend
COPY ml-pipeline/outputs /app/ml-pipeline/outputs

WORKDIR /app/backend

ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
