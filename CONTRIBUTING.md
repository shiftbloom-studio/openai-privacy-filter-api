# Contributing to OpenAI Privacy Filter API

Thank you for your interest in contributing!

## Quick Start (Without Downloading Model Weights)
To develop and run tests locally without downloading large model artifacts, use the lightweight mock/fake test fixtures:

```bash
# Backend API tests
cd apps/api
pytest tests/

# Frontend Web tests & typechecks
cd ../..
npm run lint
npm run check
```

## Guidelines
1. **API Contracts**: If modifying endpoints, update the API specification in `docs/api.md`.
2. **Hygiene**: Never commit model weight binaries, temporary caches, or `.env` credential files.
3. **Security**: Do not report security vulnerabilities in public issues. Please report security concerns directly to repository maintainers via private advisory.
4. **First Contribution**: Documentation updates, unit test additions, and test fixtures using the fake model are prioritized for review.
