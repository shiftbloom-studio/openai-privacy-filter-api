from __future__ import annotations

from .schemas import SUPPORTED_LABELS, FilterMode, PrivacySpan


def normalize_spans(text: str, spans: list[PrivacySpan]) -> list[PrivacySpan]:
    """Clamp spans to text bounds and drop unsupported or overlapping spans."""
    text_length = len(text)
    candidates: list[PrivacySpan] = []

    for span in spans:
        if span.label not in SUPPORTED_LABELS:
            continue

        start = max(0, min(span.start, text_length))
        end = max(0, min(span.end, text_length))
        if end <= start:
            continue

        candidates.append(
            span.model_copy(
                update={
                    "start": start,
                    "end": end,
                    "text": text[start:end],
                }
            )
        )

    candidates.sort(key=lambda span: (span.start, -(span.end - span.start), -span.score))

    accepted: list[PrivacySpan] = []
    cursor = 0
    for span in candidates:
        if span.start < cursor:
            continue
        accepted.append(span)
        cursor = span.end

    return accepted


def apply_redaction(
    text: str,
    spans: list[PrivacySpan],
    mode: FilterMode | str,
    mask_token: str = "[REDACTED]",
) -> tuple[str, list[PrivacySpan]]:
    selected_spans = normalize_spans(text, spans)
    redaction_mode = FilterMode(mode)

    pieces: list[str] = []
    cursor = 0
    for span in selected_spans:
        pieces.append(text[cursor : span.start])

        if redaction_mode is FilterMode.MASK:
            pieces.append(mask_token)
        elif redaction_mode is FilterMode.REMOVE:
            pieces.append("")
        else:
            pieces.append(f"[{span.label}:{text[span.start : span.end]}]")

        cursor = span.end

    pieces.append(text[cursor:])
    return "".join(pieces), selected_spans
