import type { PrivacySpan } from "./privacy-filter";
import {
  BROWSER_MODEL_ID,
  IGNORE_LABELS,
  normalizeSpans,
  stripBoundary
} from "./privacy-filter-browser";
import { BROWSER_DEFAULT_DTYPE, BROWSER_DEVICE_PREFERENCE } from "./runtime-config";

/**
 * Per-token output of the transformers.js token-classification pipeline,
 * verified against @huggingface/transformers@4.2.0 with the real
 * openai/privacy-filter model:
 *
 *   { entity: "B-private_person", score: 0.9999, index: 3, word: " Alice" }
 *
 * `word` includes its leading space in the original text, so character offsets
 * can be reconstructed exactly by walking tokens in order. The aggregated form
 * (aggregation_strategy: "simple") returns entity_group/word/score but NO
 * start/end offsets — it is useless for redaction, which is why the per-token
 * form is used directly.
 */
export type TokenClassificationToken = {
  entity?: string;
  entity_group?: string;
  score?: number;
  index?: number;
  word?: string;
};

type TokenClassifier = {
  (text: string, options?: Record<string, unknown>): Promise<TokenClassificationToken[]>;
};

type ProgressEvent = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type PipelineFactory = (
  task: "token-classification",
  model: string,
  options?: Record<string, unknown>
) => Promise<TokenClassifier>;

export type LoadStage = "idle" | "loading" | "ready" | "error";

export type LoadProgress = {
  stage: LoadStage;
  /** 0-100 when knowable, otherwise null. */
  percent: number | null;
  detail: string;
};

export type BrowserEngineOptions = {
  onProgress?: (progress: LoadProgress) => void;
  preferredDevice?: string;
};

let pipelinePromise: Promise<TokenClassifier> | null = null;
let activeDevice: string | null = null;

function toPercent(event: ProgressEvent): number | null {
  if (typeof event.progress === "number" && Number.isFinite(event.progress)) {
    const percent = event.progress;
    return Math.max(0, Math.min(100, percent <= 1 ? percent * 100 : percent));
  }
  if (typeof event.loaded === "number" && typeof event.total === "number" && event.total > 0) {
    return Math.max(0, Math.min(100, (event.loaded / event.total) * 100));
  }
  return null;
}

async function loadPipelineFactory(): Promise<PipelineFactory> {
  /* Bundled from the npm package rather than imported from a CDN at runtime.
   * The previous dynamic https import of the jsDelivr bundle downloaded fine
   * (HTTP 200) but never resolved as an ES module in the production build,
   * leaving the UI stuck at "loading runtime". The dynamic import below still
   * code-splits the library out of the initial page bundle. */
  const module = (await import("@huggingface/transformers")) as unknown as {
    pipeline?: PipelineFactory;
    env?: Record<string, unknown>;
  };

  if (typeof module.pipeline !== "function") {
    throw new Error("Transformers.js pipeline is unavailable.");
  }

  // Model weights come from the Hugging Face CDN and stay in the browser cache
  // so repeat visits do not re-download ~900 MB.
  if (module.env) {
    module.env.allowLocalModels = false;
  }

  return module.pipeline;
}

/**
 * Detect the best available backend: WebGPU when the browser exposes a working
 * adapter, otherwise WASM (CPU), which works everywhere.
 *
 * There is no WebGL branch on purpose: onnxruntime-web has no WebGL execution
 * provider, so a WebGL context would tell us nothing about model support.
 */
export async function detectDevice(): Promise<string> {
  if (typeof navigator === "undefined") {
    return "wasm";
  }
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (gpu) {
    try {
      const adapter = await gpu.requestAdapter();
      if (adapter) {
        return "webgpu";
      }
    } catch {
      // Fall through to WASM.
    }
  }
  return "wasm";
}

/**
 * Load the in-browser classifier, retrying down the device chain.
 *
 * WebGPU is fastest but is not available in every browser; WASM (CPU) is the
 * universal fallback and keeps the sandbox usable everywhere.
 */
export function loadBrowserEngine(options: BrowserEngineOptions = {}): Promise<TokenClassifier> {
  if (pipelinePromise) {
    return pipelinePromise;
  }

  const { onProgress } = options;

  const load = async (): Promise<TokenClassifier> => {
    onProgress?.({ stage: "loading", percent: 0, detail: "loading runtime" });

    const pipeline = await loadPipelineFactory();
    const preferred = options.preferredDevice ?? (await detectDevice());
    const chain = [preferred, ...BROWSER_DEVICE_PREFERENCE.filter((d) => d !== preferred)];

    let lastError: unknown = null;

    for (const device of chain) {
      try {
        onProgress?.({ stage: "loading", percent: null, detail: `loading model (${device})` });

        const classifier = await pipeline("token-classification", BROWSER_MODEL_ID, {
          device,
          dtype: BROWSER_DEFAULT_DTYPE,
          progress_callback: (event: ProgressEvent) => {
            onProgress?.({
              stage: "loading",
              percent: toPercent(event),
              detail: event.file ?? `loading model (${device})`
            });
          }
        });

        activeDevice = device;
        onProgress?.({ stage: "ready", percent: 100, detail: `ready (${device})` });
        return classifier;
      } catch (error) {
        lastError = error;
        // Keep the shared promise until the chain is exhausted: a device that
        // fails partway does not mean the load is finished, and clearing the
        // slot here would let a concurrent caller start a second 900 MB fetch.
      }
    }

    onProgress?.({ stage: "error", percent: null, detail: "model unavailable" });
    throw lastError instanceof Error ? lastError : new Error("Model could not be loaded.");
  };

  pipelinePromise = load().catch((error: unknown) => {
    // Only a terminal failure clears the slot, so the next attempt can retry.
    pipelinePromise = null;
    onProgress?.({ stage: "error", percent: null, detail: "model unavailable" });
    throw error;
  });

  return pipelinePromise;
}

export function resetBrowserEngineForTests(): void {
  pipelinePromise = null;
  activeDevice = null;
}

export function activeBrowserDevice(): string | null {
  return activeDevice;
}

/**
 * Run detection in the browser and return spans matching the API contract.
 *
 * Uses the pipeline's per-token output (verified against transformers.js 4.2.0
 * with the real model): each non-background token carries its BIOES tag,
 * score, and `word` with leading whitespace preserved. Character offsets are
 * reconstructed by walking the original text alongside the tokens, then
 * consecutive B-, I-, E- and S-tagged tokens of one label are grouped into
 * spans.
 */
export async function detectSpansInBrowser(
  text: string,
  options: BrowserEngineOptions = {}
): Promise<PrivacySpan[]> {
  const classifier = await loadBrowserEngine(options);
  const tokens = await classifier(text, { ignore_labels: IGNORE_LABELS });
  return normalizeSpans(text, tokensToSpans(Array.isArray(tokens) ? tokens : [], text));
}

/**
 * Convert per-token predictions with reconstructed offsets into spans.
 * Pure; exported for testing.
 */
export function tokensToSpans(
  tokens: readonly TokenClassificationToken[],
  text: string
): PrivacySpan[] {
  const spans: PrivacySpan[] = [];
  let cursor = 0;
  let open: { label: string; start: number; end: number; score: number } | null = null;

  const close = () => {
    if (open && open.end > open.start) {
      /* Token `word`s keep their leading space, so a span opening at a B- or
       * orphaned I-tag starts on whitespace. Shift the boundaries onto the
       * non-whitespace content so masks read "is [REDACTED]," not "is[REDACTED],". */
      let start = open.start;
      let end = open.end;
      while (start < end && /\s/.test(text[start])) {
        start += 1;
      }
      while (end > start && /\s/.test(text[end - 1])) {
        end -= 1;
      }
      if (end > start) {
        spans.push({
          label: open.label,
          start,
          end,
          text: text.slice(start, end),
          score: open.score
        });
      }
    }
    open = null;
  };

  for (const token of tokens) {
    const rawEntity = String(token.entity ?? token.entity_group ?? "");
    if (!rawEntity || rawEntity === "O") {
      close();
      continue;
    }

    const boundary = rawEntity.slice(0, 2);
    const label = stripBoundary(rawEntity);
    const score = Math.max(0, Math.min(1, Number(token.score ?? 0)));

    const word = String(token.word ?? "");
    const found = word ? text.indexOf(word, cursor) : -1;
    if (found < 0) {
      // Token text not locatable (normalisation artefact): close so offsets
      // cannot drift rather than guessing a position.
      close();
      continue;
    }

    const start = found;
    const end = found + word.length;
    cursor = end;

    if (boundary === "B-" || boundary === "S-") {
      close();
      open = { label, start, end, score };
      if (boundary === "S-") {
        close();
      }
    } else if (boundary === "I-" || boundary === "E-") {
      if (open && open.label === label) {
        open.end = end;
        open.score = Math.min(open.score, score);
      } else {
        close();
        open = { label, start, end, score };
      }
      if (boundary === "E-") {
        close();
      }
    } else {
      close();
    }
  }

  close();
  return spans;
}
