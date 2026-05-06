from __future__ import annotations

from fastapi.testclient import TestClient

from privacy_filter_api import main
from privacy_filter_api.schemas import FilterResponse, PrivacySpan


def test_health_endpoint_reports_configured_model() -> None:
    client = TestClient(main.create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model"] == "openai/privacy-filter"
    assert response.json()["model_configured"] is True


def test_api_requires_internal_token_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("PRIVACY_FILTER_INTERNAL_TOKEN", "internal-secret")
    client = TestClient(main.create_app())

    missing_token_response = client.get("/health")
    wrong_token_response = client.get(
        "/health",
        headers={main.INTERNAL_TOKEN_HEADER: "wrong-secret"},
    )
    valid_token_response = client.get(
        "/health",
        headers={main.INTERNAL_TOKEN_HEADER: "internal-secret"},
    )

    assert missing_token_response.status_code == 401
    assert wrong_token_response.status_code == 401
    assert valid_token_response.status_code == 200


def test_filter_endpoint_returns_deterministic_response(monkeypatch) -> None:
    def fake_filter_text(request):
        return FilterResponse(
            original_text=request.text,
            filtered_text="Email [REDACTED]",
            spans=[
                PrivacySpan(
                    label="private_email",
                    start=6,
                    end=23,
                    text="alice@example.com",
                    score=0.98,
                )
            ],
            model="openai/privacy-filter",
        )

    monkeypatch.setattr(main, "filter_text", fake_filter_text)
    client = TestClient(main.create_app())

    response = client.post(
        "/v1/filter",
        json={
            "text": "Email alice@example.com",
            "mode": "mask",
            "mask_token": "[REDACTED]",
            "include_spans": True,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "original_text": "Email alice@example.com",
        "filtered_text": "Email [REDACTED]",
        "spans": [
            {
                "label": "private_email",
                "start": 6,
                "end": 23,
                "text": "alice@example.com",
                "score": 0.98,
            }
        ],
        "model": "openai/privacy-filter",
    }


def test_filter_endpoint_rejects_empty_text() -> None:
    client = TestClient(main.create_app())

    response = client.post("/v1/filter", json={"text": "   "})

    assert response.status_code == 422
