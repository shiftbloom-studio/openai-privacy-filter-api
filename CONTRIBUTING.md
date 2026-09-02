# Contributing to OpenAI Privacy Filter API

Thank you for your interest in contributing!

## Quick Start (Without Downloading Model Weights)

To develop and run tests locally without downloading large model artifacts, use the lightweight mock/fake test fixtures:

```bash
# Backend API tests
cd apps/api
pytest tests/

# Frontend Web & package tests, typechecks, lint (repo root)
cd ../..
npm test
npm run typecheck
npm run lint
```

The root scripts cover both `apps/web` and `packages/privacy-filter`
(`@shiftbloom/privacy-filter`, the standalone in-browser engine). Web unit tests
run against the package source via a Vitest alias, so no dist build is needed
for the inner loop; `npm run build` produces both the package dist and the
Next.js production bundle.

## Optional: Real-Model Smoke Test

The browser engine package ships a verification script that downloads the real
~900 MB `openai/privacy-filter` weights once (then uses the local Hugging Face
cache) and checks span reconstruction end to end:

```bash
npm run verify:model
```

## Releasing the npm package

`@shiftbloom/privacy-filter` publishes from CI, never from a local machine:

1. Bump `version` in `packages/privacy-filter/package.json` in a PR and merge it.
2. Create a GitHub Release (any tag, e.g. `privacy-filter-v0.2.0`).
3. [publish-package.yml](.github/workflows/publish-package.yml) tests, builds, and publishes the
   package; versions already on npm are skipped, so re-runs are safe.

One-time setup: create the `shiftbloom` organization on npmjs.com (free for public packages) and
add an npm granular access token with publish rights as the `NPM_TOKEN` repository secret.

## Guidelines

1. **API Contracts**: If modifying endpoints, update the API specification in `docs/api.md`.
2. **Detection stays model-only**: the browser package must derive spans exclusively from the `openai/privacy-filter` model output. Do not add regex, keyword, or heuristic PII detectors; span reconstruction may only transform model output.
3. **Hygiene**: Never commit model weight binaries, temporary caches, or `.env` credential files.
4. **Security**: Do not report security vulnerabilities in public issues. See [SECURITY.md](SECURITY.md) for the private reporting channel.
5. **First Contribution**: Documentation updates, unit test additions, and test fixtures using the fake model are prioritized for review.
