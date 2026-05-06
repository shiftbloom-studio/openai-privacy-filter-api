from __future__ import annotations

import os

import pytest

from privacy_filter_api.privacy_filter import detect_spans


@pytest.mark.skipif(
    os.getenv("RUN_REAL_MODEL_TESTS") != "1",
    reason="Set RUN_REAL_MODEL_TESTS=1 to download and run openai/privacy-filter.",
)
def test_real_model_detects_email() -> None:
    spans = detect_spans("Send the report to alice@example.com.")

    assert any(span.label == "private_email" for span in spans)

