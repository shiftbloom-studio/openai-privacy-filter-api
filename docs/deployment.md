# Deployment Notes

The API has one ASGI application and one Lambda adapter. The model cache is runtime data and must stay outside source control.

## Local

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e "apps/api[dev,inference]"
HF_HOME=.hf-cache uvicorn privacy_filter_api.main:app --app-dir apps/api/src --reload
```

Run the web sandbox separately:

```bash
npm install
PRIVACY_FILTER_API_URL=http://localhost:8000 npm --workspace apps/web run dev
```

## Docker

```bash
docker build -f infra/docker/api.Dockerfile -t privacy-filter-api .
docker run --rm -p 8000:8000 -v privacy-filter-hf:/models/huggingface privacy-filter-api
```

To bake an already downloaded model into the API image, place the runtime files in
`privacy-filter-model/` before building and set `PRIVACY_FILTER_MODEL_PATH=/models/privacy-filter`
on the deployed service. The API will still report `PRIVACY_FILTER_MODEL_ID`, which should stay
`openai/privacy-filter`.

Required runtime files:

- `config.json`
- `model.safetensors`
- `tokenizer.json`
- `tokenizer_config.json`
- `viterbi_calibration.json`

For a faster Dockerfile smoke test that skips inference dependencies:

```bash
docker build -f infra/docker/api.Dockerfile --build-arg API_EXTRAS= -t privacy-filter-api:core .
```

## Google Cloud Run

Build and push the API image to Artifact Registry, then deploy the container with:

- `PORT=8000`
- `HF_HOME=/models/huggingface`
- `PRIVACY_FILTER_MODEL_PATH=/models/privacy-filter` when the image contains the baked model.
- `PRIVACY_FILTER_RUNTIME=cloud-run`
- `PRIVACY_FILTER_MODEL_ID=openai/privacy-filter`
- `PRIVACY_FILTER_INTERNAL_TOKEN=<shared server-side token>` if the API is not public.
- At least 4 GiB memory to leave room for model load and request overhead.
- CPU always allocated if cold-start latency is unacceptable.

Cloud Run instances are ephemeral. For predictable startup, either accept model download on cold start or bake/cache model files in the image during a later optimization pass. Do not commit model files into the repository.

## AWS Lambda

Use Lambda container images rather than zip packaging. The model and inference dependencies are too large for a clean zip-based Lambda workflow.

Entrypoint:

```text
privacy_filter_api.lambda_handler.handler
```

The handler wraps the same FastAPI app with `Mangum(app, lifespan="off")`. Use Lambda Function URLs or API Gateway HTTP API, allocate enough memory for model load, and expect cold starts unless using provisioned concurrency.

## AWS App Runner CI/CD

The current AWS deployment uses App Runner services backed by private ECR repositories in
`eu-central-1`:

- API service: `privacy-filter-api`
- Web service: `privacy-filter-web`
- API ECR repository: `privacy-filter-api`
- Web ECR repository: `privacy-filter-web`
- Baked model artifacts bucket: `shiftbloom-privacy-filter-build-349744179866-eu-central-1`

`.github/workflows/deploy-aws.yml` deploys automatically on pushes to `main` and can also be run
manually from GitHub Actions. It detects changed paths and deploys only the surface that changed:

- `apps/api/**`, `infra/docker/api.Dockerfile`, or `privacy-filter-model/**` deploy the API.
- `apps/web/**`, `infra/docker/web.Dockerfile`, `package.json`, or `package-lock.json` deploy the web app.
- `.dockerignore` deploys both because it affects both Docker builds.

The API App Runner service is configured for offline model loading, so the workflow restores the
model files from S3 into `privacy-filter-model/` before building the API image. Both jobs push a
commit-SHA-tagged image and `latest`, then update the existing App Runner service to the SHA-tagged
image while preserving the service's current runtime environment variables.

GitHub Actions authenticates to AWS with OIDC through:

```text
arn:aws:iam::349744179866:role/github-actions-openai-privacy-filter-deploy
```

The role trust policy is restricted to `shiftbloom-studio/openai-privacy-filter-api` on `main`.
No long-lived AWS access keys are required in GitHub secrets.

## Cloudflare

Target hostname: `privacy.shiftbloom.studio`.

Recommended routing:

- Point `privacy.shiftbloom.studio` to the deployed Next.js sandbox.
- Keep API calls on `/api/filter`; the Next.js route handler proxies to `PRIVACY_FILTER_API_URL`.
- Set the same `PRIVACY_FILTER_INTERNAL_TOKEN` on the API and the Next.js app so direct API requests are rejected unless they originate from the server-side proxy.
- Disable Cloudflare caching for `/api/*`.
- Allow static asset caching for `/_next/static/*`.
- Keep TLS mode strict and let the deployment platform manage origin certificates.
