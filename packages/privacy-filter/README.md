# @shiftbloom-studio/privacy-filter

In-browser privacy-span detection with the
[`openai/privacy-filter`](https://huggingface.co/openai/privacy-filter) model via
[Transformers.js](https://huggingface.co/docs/transformers.js). Detection runs
entirely on the visitor's device (WebGPU where available, WASM everywhere
else) — no server inference compute, and input text never leaves the browser.

- Real model inference only: spans come from the model's BIOES token
  classifications — no regex, keyword, or heuristic fallbacks.
- Long-text chunking for the model's 257-token attention window, with seam
  deduplication.
- Shared contract helpers (`validateFilterRequest`, `applyRedaction`) that
  mirror the Python API byte-for-byte.
- Works in any bundler-based app; the reference integration is the Next.js
  sandbox in this monorepo.

> **Download size:** the q4 model weights plus tokenizer are roughly **900 MB**.
> They are fetched from the Hugging Face CDN on first use and then served from
> the browser cache. Always ask for user consent before triggering the first
> load — nothing downloads until you call `loadBrowserEngine` or
> `detectSpansInBrowser`.

## Install

```bash
npm install @shiftbloom-studio/privacy-filter
```

Published from this monorepo by CI: merging a version bump in
`packages/privacy-filter/package.json` and creating a GitHub Release runs
[publish-package.yml](../../.github/workflows/publish-package.yml), which
tests, builds, and publishes the package (skipping versions already on npm).
Requires the `NPM_TOKEN` repository secret.

The package pins `@huggingface/transformers@4.2.0`, whose per-token output
shape the span reconstruction is verified against.

## Usage (Next.js)

Use it from a client component:

```tsx
"use client";

import { useState } from "react";
import {
  applyRedaction,
  detectSpansInBrowser,
  type LoadProgress
} from "@shiftbloom-studio/privacy-filter";

export function FilterButton({ text }: { text: string }) {
  const [progress, setProgress] = useState<LoadProgress | null>(null);

  async function run() {
    // Triggers the ~900 MB model download on first call — ask for consent first.
    const spans = await detectSpansInBrowser(text, { onProgress: setProgress });
    const [filtered] = applyRedaction(text, spans, "mask", "[REDACTED]");
    console.log(filtered, spans);
  }

  return (
    <button onClick={run}>
      {progress?.stage === "loading" ? `Loading: ${progress.detail}` : "Filter"}
    </button>
  );
}
```

## API

| Export | Purpose |
| --- | --- |
| `detectSpansInBrowser(text, options?)` | Load the engine (once) and return detected `PrivacySpan[]` for `text`. |
| `loadBrowserEngine(options?)` | Explicitly load the shared classifier; reports `LoadProgress`. |
| `tokensToSpans(tokens, text)` | Convert per-token BIOES output to spans (pure). |
| `chunkText(text)` / `mergeChunkSpans(chunks, spans)` | Long-text windowing helpers (pure). |
| `normalizeSpans(text, spans)` | Clamp, sort, and de-overlap spans (pure). |
| `decodeBIOESToSpans(labels, offsets)` | Constrained BIOES decode for raw argmax labels (pure). |
| `applyRedaction(text, spans, mode, maskToken)` | `mask` / `remove` / `annotate`; mirrors the Python API. |
| `validateFilterRequest(value)` | Shared request validation, same messages as the API. |
| `detectDevice()` | `webgpu` when a working adapter exists, otherwise `wasm`. |
| `MODEL_ID`, `SUPPORTED_LABELS`, `ID_TO_LABEL` | Model constants from the published config. |
| `FILTER_MODES`, `PrivacySpan`, `FilterRequest`, `FilterResponse` | Contract types. |

### Options

```ts
type BrowserEngineOptions = {
  onProgress?: (progress: LoadProgress) => void;
  preferredDevice?: string; // default: detectDevice()
};
```

`loadBrowserEngine` tries `preferredDevice` first and then falls back down
`BROWSER_DEVICE_PREFERENCE` (`webgpu` → `wasm`). A terminal failure clears the
cached promise so the next call retries.

## How detection works

1. Long input is split into overlapping windows (`chunkText`, 192-token budget
   with 48-token overlap, word-aligned seams) so nothing falls outside the
   model's 257-token banded-attention window.
2. Each window runs through the token-classification pipeline, which returns
   per-token BIOES tags with the token's surface form.
3. `tokensToSpans` reconstructs exact character offsets by walking tokens
   through the original text and groups B/I/E/S sequences into spans.
4. `mergeChunkSpans` maps chunk-local spans back to global offsets and drops
   duplicates owned by the next window.
5. `normalizeSpans` clamps, sorts, and resolves overlaps; `applyRedaction`
   renders the final text.

Steps 1, 3, 4, and 5 are pure transformations of model output. All detection
decisions are made by the model.

## Development

This package is developed inside the
[openai-privacy-filter-api](https://github.com/shiftbloom-studio/openai-privacy-filter-api)
monorepo (`packages/privacy-filter`).

```bash
npm run build --workspace @shiftbloom-studio/privacy-filter
npm run test --workspace @shiftbloom-studio/privacy-filter
npm run typecheck --workspace @shiftbloom-studio/privacy-filter
```

A real-model smoke test (downloads the actual weights):

```bash
npm run verify:model
```

## License

Apache License 2.0. See [LICENSE](LICENSE).
