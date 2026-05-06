from __future__ import annotations

import hmac
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .privacy_filter import filter_text, get_model_id, model_loaded
from .schemas import FilterRequest, FilterResponse, HealthResponse

INTERNAL_TOKEN_HEADER = "x-privacy-filter-internal-token"


def create_app() -> FastAPI:
    app = FastAPI(
        title="OpenAI Privacy Filter API",
        version="0.1.0",
        description="Small API wrapper around openai/privacy-filter.",
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_csv_env(
            "PRIVACY_FILTER_CORS_ORIGINS",
            "http://localhost:3000,https://privacy.shiftbloom.studio",
        ),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["content-type"],
    )

    @app.middleware("http")
    async def require_internal_token(request: Request, call_next):
        expected_token = os.getenv("PRIVACY_FILTER_INTERNAL_TOKEN")
        if not expected_token:
            return await call_next(request)

        provided_token = request.headers.get(INTERNAL_TOKEN_HEADER, "")
        if not hmac.compare_digest(provided_token, expected_token):
            return JSONResponse({"detail": "Not authenticated."}, status_code=401)

        return await call_next(request)

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"service": "openai-privacy-filter-api", "docs": "/docs"}

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        model = get_model_id()
        return HealthResponse(
            status="ok",
            model=model,
            model_configured=bool(model),
            model_loaded=model_loaded(),
            runtime=os.getenv("PRIVACY_FILTER_RUNTIME", "local"),
        )

    @app.post("/v1/filter", response_model=FilterResponse)
    async def filter_endpoint(request: FilterRequest) -> FilterResponse:
        return await run_in_threadpool(filter_text, request)

    return app


def _csv_env(name: str, default: str) -> list[str]:
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


app = create_app()
