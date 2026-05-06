export const FILTER_MODES = ["mask", "remove", "annotate"] as const;

export type FilterMode = (typeof FILTER_MODES)[number];

export type PrivacySpan = {
  label: string;
  start: number;
  end: number;
  text: string;
  score: number;
};

export type FilterRequest = {
  text: string;
  mode: FilterMode;
  mask_token: string;
  include_spans: boolean;
};

export type FilterResponse = {
  original_text: string;
  filtered_text: string;
  spans: PrivacySpan[];
  model: string;
};

export function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function isFilterMode(value: unknown): value is FilterMode {
  return typeof value === "string" && FILTER_MODES.includes(value as FilterMode);
}

export function validateFilterRequest(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return "Request body must be a JSON object.";
  }

  const request = value as Partial<FilterRequest>;

  if (typeof request.text !== "string" || request.text.trim().length === 0) {
    return "Enter text before running the privacy filter.";
  }

  if (request.text.length > 50_000) {
    return "Text must be 50,000 characters or fewer.";
  }

  if (!isFilterMode(request.mode)) {
    return "Choose a supported filter mode.";
  }

  if (typeof request.mask_token !== "string" || request.mask_token.trim().length === 0) {
    return "Mask token cannot be blank.";
  }

  if (typeof request.include_spans !== "boolean") {
    return "include_spans must be a boolean.";
  }

  return null;
}

export function spanKey(span: PrivacySpan): string {
  return `${span.label}-${span.start}-${span.end}-${span.score}`;
}

