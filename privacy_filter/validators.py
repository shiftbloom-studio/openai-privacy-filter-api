"""Payload validation guardrails for privacy filter endpoints."""
from typing import Tuple

MAX_PAYLOAD_CHAR_LENGTH = 1_000_000

def validate_text_payload(text: str) -> Tuple[bool, str]:
    """
    Validates that incoming text payload satisfies sanity and size constraints.
    Returns (is_valid, error_message).
    """
    if text is None:
        return False, "Payload cannot be null"

    if not isinstance(text, str):
        return False, "Payload must be a valid string"

    if len(text.strip()) == 0:
        return False, "Payload cannot be empty or whitespace only"

    if len(text) > MAX_PAYLOAD_CHAR_LENGTH:
        return False, f"Payload exceeds maximum allowed length of {MAX_PAYLOAD_CHAR_LENGTH} characters"

    return True, ""
