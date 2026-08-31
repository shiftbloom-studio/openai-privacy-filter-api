FROM public.ecr.aws/docker/library/python:3.12-slim AS builder

ARG API_EXTRAS=inference
WORKDIR /build

COPY apps/api/pyproject.toml apps/api/pyproject.toml
COPY apps/api/README.md apps/api/README.md
COPY apps/api/src apps/api/src
COPY README.md README.md

RUN python -m pip install --upgrade pip wheel
RUN python -m pip wheel --wheel-dir /wheels ./apps/api
RUN if [ "$API_EXTRAS" = "inference" ]; then \
      python -m pip wheel --wheel-dir /wheels --index-url https://download.pytorch.org/whl/cpu torch==2.11.0 && \
      python -m pip wheel --wheel-dir /wheels transformers==5.8.0; \
    else \
      true; \
    fi

FROM public.ecr.aws/docker/library/python:3.12-slim AS runtime

ARG API_EXTRAS=inference
ARG PRIVACY_FILTER_MODEL_ID=openai/privacy-filter
ENV HF_HOME=/models/huggingface \
    PORT=8000 \
    PRIVACY_FILTER_MODEL_ID=${PRIVACY_FILTER_MODEL_ID} \
    PRIVACY_FILTER_RUNTIME=docker \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY privacy-filter-model /models/privacy-filter
COPY --from=builder /wheels /wheels
RUN if [ "$API_EXTRAS" = "inference" ]; then \
      python -m pip install --no-cache-dir --no-index --find-links=/wheels privacy-filter-api transformers torch; \
    else \
      python -m pip install --no-cache-dir --no-index --find-links=/wheels privacy-filter-api; \
    fi \
    && rm -rf /wheels

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

CMD ["sh", "-c", "uvicorn privacy_filter_api.main:app --host 0.0.0.0 --port ${PORT}"]
