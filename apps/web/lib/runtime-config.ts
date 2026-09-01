/**
 * Runtime selection for the privacy filter.
 *
 * Two execution paths share one request/response contract:
 *
 * - `server`: the Next.js server route proxies to the Python FastAPI service
 *   (or any compatible `/v1/filter` endpoint). Requires inference compute.
 * - `browser`: the model runs in the visitor's browser through Transformers.js
 *   on WebGPU, falling back to WASM (CPU). Requires no server-side
 *   compute and no text ever leaves the device.
 *
 * The Shiftbloom deployment runs `browser` because there is no provisioned
 * inference compute. Other targets stay selectable with
 * `NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME`.
 */

export const FILTER_RUNTIMES = ["server", "browser"] as const;

export type FilterRuntime = (typeof FILTER_RUNTIMES)[number];

export const DEFAULT_FILTER_RUNTIME: FilterRuntime = "browser";

export function isFilterRuntime(value: unknown): value is FilterRuntime {
  return typeof value === "string" && FILTER_RUNTIMES.includes(value as FilterRuntime);
}

/**
 * Resolve the runtime from the build-time environment. Unknown values fall back
 * to the default rather than throwing, so a typo in a deployment variable
 * degrades to the no-compute path instead of taking the site down.
 */
export function resolveFilterRuntime(rawValue: string | undefined): FilterRuntime {
  if (!rawValue) {
    return DEFAULT_FILTER_RUNTIME;
  }
  const candidate = rawValue.trim().toLowerCase();
  return isFilterRuntime(candidate) ? candidate : DEFAULT_FILTER_RUNTIME;
}

export function getFilterRuntime(): FilterRuntime {
  return resolveFilterRuntime(process.env.NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME);
}

/**
 * Backend device preference for the browser runtime, tried in order.
 *
 * transformers.js / onnxruntime-web supports exactly two browser backends:
 * `webgpu` and `wasm`. There is no WebGL backend — WebGL was never an
 * onnxruntime execution provider, so requesting it can only fail or, worse,
 * fall through silently. WASM runs everywhere (CPU), just slower.
 */
export const BROWSER_DEVICE_PREFERENCE = ["webgpu", "wasm"] as const;

export type BrowserDevice = (typeof BROWSER_DEVICE_PREFERENCE)[number];

export const BROWSER_DEFAULT_DTYPE = "q4";
