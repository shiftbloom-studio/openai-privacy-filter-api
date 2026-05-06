from __future__ import annotations

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SUPPORTED_LABELS = frozenset(
    {
        "account_number",
        "private_address",
        "private_email",
        "private_person",
        "private_phone",
        "private_url",
        "private_date",
        "secret",
    }
)


class FilterMode(StrEnum):
    MASK = "mask"
    REMOVE = "remove"
    ANNOTATE = "annotate"


class FilterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=50_000)
    mode: FilterMode = FilterMode.MASK
    mask_token: str = Field(default="[REDACTED]", min_length=1, max_length=64)
    include_spans: bool = True

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must contain at least one non-whitespace character.")
        return value

    @field_validator("mask_token")
    @classmethod
    def mask_token_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Mask token must contain at least one non-whitespace character.")
        return value


class PrivacySpan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    text: str
    score: float = Field(ge=0.0, le=1.0)

    @field_validator("label")
    @classmethod
    def label_must_be_supported(cls, value: str) -> str:
        if value not in SUPPORTED_LABELS:
            raise ValueError(f"Unsupported privacy label: {value}")
        return value

    @model_validator(mode="after")
    def end_must_follow_start(self) -> PrivacySpan:
        if self.end <= self.start:
            raise ValueError("Span end must be greater than start.")
        return self


class FilterResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    original_text: str
    filtered_text: str
    spans: list[PrivacySpan]
    model: str


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"]
    model: str
    model_configured: bool
    model_loaded: bool
    runtime: str

