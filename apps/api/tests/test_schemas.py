from __future__ import annotations

import pytest
from pydantic import ValidationError

from privacy_filter_api.schemas import FilterMode, FilterRequest, PrivacySpan


def test_filter_request_rejects_blank_text() -> None:
    with pytest.raises(ValidationError):
        FilterRequest(text="   ")


def test_filter_request_defaults_to_mask_mode() -> None:
    request = FilterRequest(text="Email alice@example.com")

    assert request.mode is FilterMode.MASK
    assert request.mask_token == "[REDACTED]"
    assert request.include_spans is True


def test_privacy_span_rejects_unknown_label() -> None:
    with pytest.raises(ValidationError):
        PrivacySpan(label="public_name", start=0, end=5, text="Alice", score=0.9)


def test_privacy_span_requires_positive_length() -> None:
    with pytest.raises(ValidationError):
        PrivacySpan(label="private_person", start=5, end=5, text="", score=0.9)

