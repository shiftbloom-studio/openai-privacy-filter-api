from __future__ import annotations

import os
import threading
from collections.abc import Callable, Iterable
from typing import Any

from .redaction import apply_redaction
from .schemas import SUPPORTED_LABELS, FilterRequest, FilterResponse, PrivacySpan

DEFAULT_MODEL_ID = "openai/privacy-filter"

_PIPELINE: Callable[[str], Iterable[dict[str, Any]]] | None = None
_PIPELINE_LOCK = threading.Lock()


def get_model_id() -> str:
    return os.getenv("PRIVACY_FILTER_MODEL_ID", DEFAULT_MODEL_ID)


def get_model_source() -> str:
    return os.getenv("PRIVACY_FILTER_MODEL_PATH") or get_model_id()


def model_loaded() -> bool:
    return _PIPELINE is not None


def reset_pipeline_for_tests() -> None:
    global _PIPELINE
    with _PIPELINE_LOCK:
        _PIPELINE = None


def get_pipeline() -> Callable[[str], Iterable[dict[str, Any]]]:
    global _PIPELINE
    if _PIPELINE is not None:
        return _PIPELINE

    with _PIPELINE_LOCK:
        if _PIPELINE is not None:
            return _PIPELINE

        try:
            from transformers import pipeline
        except ImportError as exc:
            raise RuntimeError(
                "Install the inference extra before running the real model: "
                'python -m pip install -e "apps/api[inference]"'
            ) from exc

        model_path = os.getenv("PRIVACY_FILTER_MODEL_PATH")
        kwargs: dict[str, Any] = {
            "model": model_path or get_model_id(),
            "aggregation_strategy": os.getenv("PRIVACY_FILTER_AGGREGATION", "simple"),
        }

        device = os.getenv("PRIVACY_FILTER_DEVICE")
        if device:
            kwargs["device"] = int(device) if device.lstrip("-").isdigit() else device

        revision = os.getenv("PRIVACY_FILTER_REVISION")
        if revision and not model_path:
            kwargs["revision"] = revision

        if os.getenv("PRIVACY_FILTER_TRUST_REMOTE_CODE", "false").lower() == "true":
            kwargs["trust_remote_code"] = True

        _PIPELINE = pipeline("token-classification", **kwargs)
        return _PIPELINE


def detect_spans(
    text: str,
    classifier: Callable[[str], Iterable[dict[str, Any]]] | None = None,
) -> list[PrivacySpan]:
    runner = classifier or get_pipeline()
    raw_entities = runner(text)
    spans = [_span_from_entity(entity, text) for entity in raw_entities]
    return [span for span in spans if span is not None]


def filter_text(
    request: FilterRequest,
    classifier: Callable[[str], Iterable[dict[str, Any]]] | None = None,
) -> FilterResponse:
    detected_spans = detect_spans(request.text, classifier=classifier)
    filtered_text, selected_spans = apply_redaction(
        request.text,
        detected_spans,
        mode=request.mode,
        mask_token=request.mask_token,
    )

    return FilterResponse(
        original_text=request.text,
        filtered_text=filtered_text,
        spans=selected_spans if request.include_spans else [],
        model=get_model_id(),
    )


def _span_from_entity(entity: dict[str, Any], text: str) -> PrivacySpan | None:
    label = _normalize_label(
        str(entity.get("entity_group") or entity.get("entity") or entity.get("label") or "")
    )
    if label not in SUPPORTED_LABELS:
        return None

    try:
        start = int(entity["start"])
        end = int(entity["end"])
    except (KeyError, TypeError, ValueError):
        return None

    if start < 0 or end > len(text) or end <= start:
        return None

    score = entity.get("score", 0.0)
    try:
        confidence = float(score)
    except (TypeError, ValueError):
        confidence = 0.0

    confidence = min(1.0, max(0.0, confidence))

    try:
        return PrivacySpan(
            label=label,
            start=start,
            end=end,
            text=text[start:end],
            score=confidence,
        )
    except ValueError:
        return None


def _normalize_label(label: str) -> str:
    cleaned = label.strip().lower()
    for prefix in ("b-", "i-"):
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix) :]
    return cleaned
