# Security Policy

## Reporting a Vulnerability

Please do **not** report security vulnerabilities in public issues.

Report them through a private GitHub security advisory:
<https://github.com/shiftbloom-studio/openai-privacy-filter-api/security/advisories/new>

We aim to acknowledge reports within a few days and will coordinate disclosure
with you once a fix is available.

## Scope Notes

- The sandbox at `privacy.shiftbloom.studio` is a demonstration deployment.
  Model output is advisory; do not rely on it as your only privacy control.
- In `browser` runtime mode, input text never leaves the visitor's device.
- Keep `PRIVACY_FILTER_INTERNAL_TOKEN` set whenever a self-hosted API is
  reachable outside a private network, and keep CORS origins narrow.
- Model files, caches, and credentials must never be committed to the
  repository.
