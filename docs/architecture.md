# System Architecture & Dataflow Guide

This document outlines the architectural components and request lifecycles in `openai-privacy-filter-api`.

```mermaid
flowchart LR
    Client[Web Browser] -->|HTTPS| WebApp[Next.js Server Proxy (apps/web)]
    WebApp -->|X-Internal-Token| API[FastAPI Backend (apps/api)]
    API -->|Inference| HF[Hugging Face Transformer Engine]
```

## Security Invariants
1. **Isolated Token Verification**: The browser never interfaces directly with the backend API key or internal tokens.
2. **Deterministic Redaction**: Spans are extracted with character index bounds and validated before redaction string substitution.
