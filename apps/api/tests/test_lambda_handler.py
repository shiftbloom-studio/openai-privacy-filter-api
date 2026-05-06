from __future__ import annotations

from privacy_filter_api.lambda_handler import handler


def test_lambda_handler_is_callable() -> None:
    assert callable(handler)

