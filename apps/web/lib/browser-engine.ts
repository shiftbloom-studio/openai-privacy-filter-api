import type { PrivacySpan } from "./privacy-filter";
import {
  BROWSER_MODEL_ID,
  ID_TO_LABEL,
  IGNORE_LABELS,
  decodeBIOESToSpans,
  normalizeSpans
} from "./privacy-filter-browser";
import { BROWSER_DEFAULT_DTYPE, BROWSER_DEVICE_PREFERENCE } from "./runtime-config";

type TokenClassificationOutput = {
  logits: { dims: readonly number[]; data: Float32Array | number[] };
};

type TokenClassifier = {
  (text: string, options?: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
  (batch: string[], options?: Record<string, unknown>): Promise<TokenClassificationOutput[]>;
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

/** Detect the best available backend, preferring WebGPU, then WebGL, then WASM. */
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
      // Fall through to the WebGL check.
    }
  }
  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        (canvas.getContext("webgl") as WebGLRenderingContext | null);
      if (gl) {
        return "webgl";
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
 * WebGPU is fastest but is not available in every browser; WebGL is the broad
 * fallback the Shiftbloom deployment targets, and WASM keeps the sandbox usable
 * when no GPU backend exists at all.
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
 * Uses the batch form to recover per-token logits and character offsets, then
 * applies the constrained BIOES decode the model's published calibration
 * specifies. Falls back to the pipeline's own aggregation when the raw logits
 * are not exposed, so a Transformers.js upgrade cannot silently break detection.
 */
export async function detectSpansInBrowser(
  text: string,
  options: BrowserEngineOptions = {}
): Promise<PrivacySpan[]> {
  const classifier = await loadBrowserEngine(options);

  const [result] = (await (classifier as (
    batch: string[],
    options?: Record<string, unknown>
  ) => Promise<TokenClassificationOutput[]>)([text], {
    ignore_labels: IGNORE_LABELS
  })) as TokenClassificationOutput[];

  const { logits } = result ?? {};
  if (!logits?.data || !Array.isArray(logits.dims) || logits.dims.length < 2) {
    return detectSpansViaAggregation(classifier, text);
  }

  const [sequenceLength, numLabels] = logits.dims as number[];
  const scores = logits.data as ArrayLike<number>;

  const tokenLabels: string[] = [];
  for (let token = 0; token < sequenceLength; token += 1) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let label = 0; label < numLabels; label += 1) {
      const score = scores[token * numLabels + label];
      if (score > bestScore) {
        bestScore = score;
        bestIndex = label;
      }
    }
    tokenLabels.push(labelForIndex(bestIndex));
  }

  const offsets = await computeOffsets(classifier, text, sequenceLength);
  if (!offsets) {
    return detectSpansViaAggregation(classifier, text);
  }

  const decoded = decodeBIOESToSpans(tokenLabels, offsets);
  return normalizeSpans(text, decoded);
}

async function detectSpansViaAggregation(
  classifier: TokenClassifier,
  text: string
): Promise<PrivacySpan[]> {
  const entities = (await (
    classifier as (t: string, options?: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
  )(text, { ignore_labels: IGNORE_LABELS, aggregation_strategy: "simple" })) as Array<
    Record<string, unknown>
  >;

  const spans: PrivacySpan[] = [];
  for (const entity of entities) {
    const rawLabel = String(entity.entity_group ?? entity.entity ?? entity.label ?? "");
    const start = Number(entity.start);
    const end = Number(entity.end);
    const score = Number(entity.score ?? 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      continue;
    }
    spans.push({
      label: rawLabel.replace(/^[BIES]-/, "").toLowerCase(),
      start,
      end,
      text: text.slice(start, end),
      score: Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0))
    });
  }
  return normalizeSpans(text, spans);
}

/**
 * Recover character offsets by re-tokenizing in the browser.
 *
 * Returns null when the tokenizer is unreachable so the caller can fall back to
 * pipeline aggregation rather than returning mis-positioned spans.
 */
async function computeOffsets(
  classifier: unknown,
  text: string,
  sequenceLength: number
): Promise<{ start: number; end: number }[] | null> {
  const tokenizer = (classifier as { tokenizer?: { _tokenizer?: unknown } }).tokenizer;
  const encoded = await (
    tokenizer as
      | { _call?(t: string, options?: Record<string, unknown>): Promise<unknown> }
      | undefined
  )?._call?.(text, { return_offsets: true });

  const offsets = extractOffsets(encoded);
  if (!offsets) {
    return null;
  }
  if (offsets.length === sequenceLength) {
    return offsets;
  }
  // Strip special tokens from the front/back to align with the model sequence.
  return offsets.length > sequenceLength
    ? offsets.slice(offsets.length - sequenceLength)
    : null;
}

function extractOffsets(encoded: unknown): { start: number; end: number }[] | null {
  if (!encoded || typeof encoded !== "object") {
    return null;
  }
  const candidate = encoded as {
    offsets?: unknown;
    input_ids?: { offsets?: unknown };
  };
  const raw = candidate.offsets ?? candidate.input_ids?.offsets;
  if (!Array.isArray(raw)) {
    return null;
  }
  const parsed: { start: number; end: number }[] = [];
  for (const item of raw) {
    if (Array.isArray(item) && item.length >= 2) {
      const start = Number(item[0]);
      const end = Number(item[1]);
      if (Number.isInteger(start) && Number.isInteger(end)) {
        parsed.push({ start, end });
      }
    }
  }
  return parsed.length > 0 ? parsed : null;
}

/** Map a class index to its BIOES label using the model's bundled id2label order. */
function labelForIndex(index: number): string {
  return ID_TO_LABEL[index] ?? "O";
}
