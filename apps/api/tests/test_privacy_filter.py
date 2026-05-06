from __future__ import annotations

from privacy_filter_api.privacy_filter import (
    detect_spans,
    filter_text,
    get_model_id,
    get_model_source,
)
from privacy_filter_api.schemas import FilterMode, FilterRequest


def test_model_source_can_use_local_model_path_without_changing_reported_model_id(
    monkeypatch,
) -> None:
    monkeypatch.setenv("PRIVACY_FILTER_MODEL_PATH", "/models/privacy-filter")

    assert get_model_source() == "/models/privacy-filter"
    assert get_model_id() == "openai/privacy-filter"


def test_detect_spans_maps_pipeline_entities_to_supported_spans() -> None:
    def fake_classifier(text: str):
        assert text == "Alice emailed alice@example.com"
        return [
            {
                "entity_group": "PRIVATE_PERSON",
                "start": 0,
                "end": 5,
                "score": 0.87,
            },
            {
                "entity_group": "private_email",
                "start": 14,
                "end": 31,
                "score": 0.99,
            },
            {
                "entity_group": "public",
                "start": 6,
                "end": 13,
                "score": 0.2,
            },
        ]

    spans = detect_spans("Alice emailed alice@example.com", classifier=fake_classifier)

    assert [span.label for span in spans] == ["private_person", "private_email"]
    assert spans[0].text == "Alice"


def test_filter_text_can_hide_spans_in_response() -> None:
    def fake_classifier(_text: str):
        return [{"entity_group": "private_email", "start": 6, "end": 23, "score": 0.99}]

    response = filter_text(
        FilterRequest(
            text="Email alice@example.com",
            mode=FilterMode.MASK,
            include_spans=False,
        ),
        classifier=fake_classifier,
    )

    assert response.filtered_text == "Email [REDACTED]"
    assert response.spans == []
