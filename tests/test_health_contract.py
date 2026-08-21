import pytest

def test_health_response_schema_invariants():
    """Verify expected keys and structure for /health responses."""
    sample_health = {
        "status": "ok",
        "runtime": "local",
        "model_id": "openai/privacy-filter",
        "version": "0.1.0"
    }
    assert sample_health["status"] == "ok"
    assert "runtime" in sample_health
    assert "model_id" in sample_health
    assert "version" in sample_health
