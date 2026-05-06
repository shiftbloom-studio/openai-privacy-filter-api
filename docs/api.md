# API Contract

Base URL defaults to `http://localhost:8000`.

## `GET /health`

Returns runtime and model readiness without loading the model.

```json
{
  "status": "ok",
  "model": "openai/privacy-filter",
  "model_configured": true,
  "model_loaded": false,
  "runtime": "local"
}
```

## `POST /v1/filter`

Request:

```json
{
  "text": "My name is Alice Smith and my email is alice@example.com.",
  "mode": "mask",
  "mask_token": "[REDACTED]",
  "include_spans": true
}
```

Supported modes:

- `mask` replaces each accepted span with `mask_token`.
- `remove` removes each accepted span.
- `annotate` replaces each accepted span with `[label:value]`.

Supported labels:

- `account_number`
- `private_address`
- `private_email`
- `private_person`
- `private_phone`
- `private_url`
- `private_date`
- `secret`

Response:

```json
{
  "original_text": "My name is Alice Smith and my email is alice@example.com.",
  "filtered_text": "My name is [REDACTED] and my email is [REDACTED].",
  "spans": [
    {
      "label": "private_person",
      "start": 11,
      "end": 22,
      "text": "Alice Smith",
      "score": 0.97
    }
  ],
  "model": "openai/privacy-filter"
}
```

## Runtime Configuration

- `PRIVACY_FILTER_MODEL_ID` defaults to `openai/privacy-filter`.
- `PRIVACY_FILTER_CORS_ORIGINS` is a comma-separated allowlist.
- `PRIVACY_FILTER_RUNTIME` appears in `/health`.
- `HF_HOME` controls where Hugging Face model files are cached.
- `PRIVACY_FILTER_DEVICE` can be set for supported Transformers device selection.
- `PRIVACY_FILTER_REVISION` pins a Hugging Face model revision.
- `PRIVACY_FILTER_TRUST_REMOTE_CODE=true` opts into remote code if a future model revision requires it.

