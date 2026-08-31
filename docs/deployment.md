# Deployment Notes

The sandbox has two runtimes behind one contract. Pick based on whether you have inference compute:

| Runtime | Inference compute | Where text is processed | Notes |
| --- | --- | --- | --- |
| `browser` (default) | none | visitor's device | WebGPU, then WebGL, then WASM. Used by the Shiftbloom deployment. |
| `server` | required | your API host | Next.js proxies `/api/filter` to FastAPI. |

Set `NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME` at **build time** — Next.js inlines `NEXT_PUBLIC_*` into
the client bundle, so changing it requires a rebuild, not just a restart.

## Vercel — the Shiftbloom deployment

`privacy.shiftbloom.studio` runs on Vercel with the `browser` runtime, so no inference compute is
provisioned anywhere.

Set **Root Directory** to `apps/web`. Dependencies are hoisted to the monorepo root by npm
workspaces, so Vercel's default `npm install` would find no lockfile inside `apps/web`. The shipped
[vercel.json](vercel.json) overrides both commands:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/web` |
| Framework Preset | Next.js |
| Install Command | `cd ../.. && npm install` |
| Build Command | `cd ../.. && npm --workspace apps/web run build` |
| Output Directory | `.next` |

Do not use `npm --prefix ../..` for the build: it resolves dependencies but does not change the
workspace root, so `--workspace apps/web` fails with `No workspaces found`.

`NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME` is pinned to `browser` in `vercel.json`. Set it to `server` only
if you also deploy the API and set `PRIVACY_FILTER_API_URL`.

In browser mode the deployment needs no model artifacts, no `PRIVACY_FILTER_API_URL`, and no internal
token. Visitors download roughly 900 MB once, behind a consent dialog, and the browser caches it.

## In-browser (WebGL/WebGPU) — the Shiftbloom deployment

This is the default and requires no server-side compute, no model files, and no Python runtime. The
`q4` ONNX variant of `openai/privacy-filter` is fetched from the Hugging Face CDN on first use and
cached by the browser.

```bash
npm install
npm --workspace apps/web run build
npm --workspace apps/web run start
```

Build the container with the default (browser) runtime:

```bash
docker build -f infra/docker/web.Dockerfile -t privacy-filter-web .
```

Because inference is client-side:

- Input text never leaves the visitor's device — there is no PII in transit or at rest server-side.
- The download is about 900 MB (~874 MB of `q4` ONNX weights plus a ~26 MB tokenizer). The sandbox
  shows a consent dialog before fetching any of it; nothing is downloaded on page load. Consent is
  remembered locally, and declining is a deferral — the visitor can accept on a later attempt.
- Once downloaded, the weights stay in the browser cache, so repeat visits are fast.
- WebGPU is fastest where supported. WebGL is the broad fallback. WASM keeps the sandbox usable with
  no GPU backend, at reduced speed.
- Browsers without WebGL2/WebGL (very old clients, some locked-down environments) cannot run the
  model in-browser; those users should self-host the `server` runtime.

Everything below documents the `server` runtime, which remains fully maintained for self-hosters.

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
NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=server \
  PRIVACY_FILTER_API_URL=http://localhost:8000 npm --workspace apps/web run dev
```

## Docker

```bash
docker build -f infra/docker/api.Dockerfile -t privacy-filter-api .
docker run --rm -p 8000:8000 -v privacy-filter-hf:/models/huggingface privacy-filter-api
```

To build the web image against the API instead of the browser runtime:

```bash
docker build -f infra/docker/web.Dockerfile \
  --build-arg NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=server \
  -t privacy-filter-web .
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

## AWS App Runner (self-hosters only)

The App Runner services in `eu-central-1` are **not** part of the Shiftbloom deployment, and the
workflow is currently disabled. They are retained for operators who have provisioned inference
compute and want to run the `server` runtime:

- API service: `privacy-filter-api` (private ECR `privacy-filter-api`)
- Web service: `privacy-filter-web` (private ECR `privacy-filter-web`)
- Baked model artifacts bucket: `shiftbloom-privacy-filter-build-349744179866-eu-central-1`

`.github/workflows/deploy-aws.yml` deploys on pushes to `main` and can also be run manually from
GitHub Actions. It detects changed paths and deploys only the surface that changed:

- `apps/api/**`, `infra/docker/api.Dockerfile`, or `privacy-filter-model/**` deploy the API.
- `apps/web/**`, `infra/docker/web.Dockerfile`, `package.json`, or `package-lock.json` deploy the web app.
- `.dockerignore` deploys both because it affects both Docker builds.

### Relationship to the Shiftbloom deployment

Shiftbloom's production deployment is **Vercel**, not App Runner — see
[Vercel — the Shiftbloom deployment](#vercel--the-shiftbloom-deployment). There is no server-side
inference compute, so the App Runner API service is not part of it and the workflow is disabled.

If you enable this workflow for your own infrastructure:

1. On `push` to `main`, the API service is never deployed automatically — only the web service is.
   The API service can still be deployed deliberately with the `api` target once you have
   provisioned compute.
2. The web service builds with `NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME=browser` by default. Manual runs
   can select `browser` or `server`.

The web service needs no model artifacts, no `PRIVACY_FILTER_API_URL`, and no internal token in
browser mode.

Forks should replace the AWS account id, service ARNs, ECR repositories, artifact bucket, and OIDC
role with their own infrastructure.

GitHub Actions authenticates to AWS with OIDC through:

```text
arn:aws:iam::349744179866:role/github-actions-openai-privacy-filter-deploy
```

The role trust policy is restricted to `shiftbloom-studio/openai-privacy-filter-api` on `main`.
No long-lived AWS access keys are required in GitHub secrets.

## Cloudflare (optional)

Cloudflare is **not** required for the Shiftbloom deployment — Vercel serves
`privacy.shiftbloom.studio` directly. This section applies only if you choose to put Cloudflare in
front of your own deployment.

Target hostname: `privacy.shiftbloom.studio`.

Recommended routing:

- Point `privacy.shiftbloom.studio` to the deployed Next.js sandbox.
- In `browser` mode (Shiftbloom default) there is no `/api/filter` traffic — inference happens in the
  visitor's browser. Allow caching for `/_next/static/*` and for the Hugging Face CDN model files the
  browser fetches.
- In `server` mode, keep API calls on `/api/filter`; the Next.js route handler proxies to
  `PRIVACY_FILTER_API_URL`. Set the same `PRIVACY_FILTER_INTERNAL_TOKEN` on the API and the Next.js
  app so direct API requests are rejected unless they originate from the server-side proxy, and
  disable Cloudflare caching for `/api/*`.
- Allow static asset caching for `/_next/static/*`.
- Keep TLS mode strict and let the deployment platform manage origin certificates.
