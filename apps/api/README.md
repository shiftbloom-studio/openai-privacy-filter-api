# privacy-filter-api

FastAPI wrapper service and AWS Lambda adapter for [`openai/privacy-filter`](https://huggingface.co/openai/privacy-filter).

This package detects privacy-sensitive spans in unstructured text (names, emails, phone numbers, addresses, account numbers, dates, secrets, URLs) and provides configurable text redaction (`mask`, `remove`, `annotate`).

## Installation

From the repository root or inside `apps/api`:

```bash
# Core API & dev dependencies (no inference dependencies required for testing)
pip install -e ".[dev]"

# With local PyTorch / Transformers model inference dependencies
pip install -e ".[dev,inference]"
```

## Running the API

### Development Mode (Mock / Pipeline Tests)
```bash
uvicorn privacy_filter_api.main:app --reload
```

### With Local / Cached Model Inference
```bash
HF_HOME=.hf-cache uvicorn privacy_filter_api.main:app --reload
```

## API Endpoints

- **`GET /health`**: Healthcheck endpoint returning runtime status, model id, and service metadata.
- **`POST /v1/filter`**: Main redaction endpoint.

### Example Request

```bash
curl -X POST http://localhost:8000/v1/filter \
  -H "Content-Type: application/json" \
  -d '{
    "text": "My name is Alice Smith and my email is alice@example.com.",
    "mode": "mask",
    "mask_token": "[REDACTED]",
    "include_spans": true
  }'
```

### Supported Redaction Modes
- `mask`: Replaces detected private spans with `mask_token` (default: `[REDACTED]`).
- `remove`: Strips detected private spans from the output text.
- `annotate`: Replaces detected spans with formatted tags like `[private_person:Alice Smith]`.

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `PRIVACY_FILTER_MODEL_ID` | `openai/privacy-filter` | Hugging Face model repository identifier. |
| `PRIVACY_FILTER_MODEL_PATH` | `""` | Optional local directory path for offline model files. |
| `PRIVACY_FILTER_RUNTIME` | `local` | Runtime environment label reported in `/health`. |
| `PRIVACY_FILTER_INTERNAL_TOKEN` | `""` | Optional shared token required via `X-Internal-Token` header. |
| `PRIVACY_FILTER_CORS_ORIGINS` | `http://localhost:3000,...` | Comma-separated list of allowed CORS origins. |

## Running Tests

```bash
pytest
```
