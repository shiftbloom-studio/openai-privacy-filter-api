from __future__ import annotations

from privacy_filter_api.redaction import apply_redaction, normalize_spans
from privacy_filter_api.schemas import FilterMode, PrivacySpan


def test_mask_redaction_replaces_private_text() -> None:
    text = "Email alice@example.com today."
    span = PrivacySpan(label="private_email", start=6, end=23, text="alice@example.com", score=0.99)

    filtered, spans = apply_redaction(text, [span], FilterMode.MASK)

    assert filtered == "Email [REDACTED] today."
    assert spans == [span]


def test_remove_redaction_deletes_private_text() -> None:
    text = "Call +1 555 0100 now."
    span = PrivacySpan(label="private_phone", start=5, end=16, text="+1 555 0100", score=0.91)

    filtered, _ = apply_redaction(text, [span], FilterMode.REMOVE)

    assert filtered == "Call  now."


def test_annotate_redaction_marks_private_text() -> None:
    text = "Alice signed in."
    span = PrivacySpan(label="private_person", start=0, end=5, text="Alice", score=0.88)

    filtered, _ = apply_redaction(text, [span], FilterMode.ANNOTATE)

    assert filtered == "[private_person:Alice] signed in."


def test_normalize_spans_drops_overlaps_and_keeps_first_best_span() -> None:
    text = "Alice alice@example.com"
    spans = [
        PrivacySpan(label="private_person", start=0, end=5, text="Alice", score=0.70),
        PrivacySpan(label="private_email", start=0, end=23, text=text, score=0.95),
        PrivacySpan(label="private_email", start=6, end=23, text="alice@example.com", score=0.99),
    ]

    normalized = normalize_spans(text, spans)

    assert normalized == [
        PrivacySpan(label="private_email", start=0, end=23, text=text, score=0.95)
    ]
