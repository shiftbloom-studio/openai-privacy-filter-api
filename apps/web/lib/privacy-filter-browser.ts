import type { PrivacySpan } from "./privacy-filter";

export const BROWSER_MODEL_ID = "openai/privacy-filter";

/**
 * The 8 taxonomy labels, expanded to BIOES boundary tags plus the background
 * class. Mirrors `id2label` from the model config.
 */
const SPAN_LABELS = [
  "account_number",
  "private_address",
  "private_date",
  "private_email",
  "private_person",
  "private_phone",
  "private_url",
  "secret"
] as const;

export const ID_TO_LABEL: readonly string[] = [
  "O",
  ...SPAN_LABELS.flatMap((label) => [`B-${label}`, `I-${label}`, `E-${label}`, `S-${label}`])
];

export const SUPPORTED_LABELS: ReadonlySet<string> = new Set(SPAN_LABELS);

export const IGNORE_LABELS: readonly string[] = ["O"];

/**
 * Strip the BIOES boundary prefix. `S-private_person` and `B-private_person`
 * both denote a `private_person` span.
 */
export function stripBoundary(label: string): string {
  const trimmed = label.trim();
  if (trimmed.toUpperCase() === "O") {
    return "O";
  }
  const cleaned = trimmed.toLowerCase();
  for (const prefix of ["b-", "i-", "e-", "s-"]) {
    if (cleaned.startsWith(prefix)) {
      return cleaned.slice(prefix.length);
    }
  }
  return cleaned;
}

export function isSupportedLabel(label: string): boolean {
  return SUPPORTED_LABELS.has(stripBoundary(label));
}

/**
 * Constrained BIOES sequence decoding over per-token argmax labels.
 *
 * The published Viterbi calibration ships all six transition biases at 0.0, so
 * the constrained decode reduces to accepting only legal BIOES boundary
 * transitions. Any span that runs to the end of the sequence without reaching
 * `E-` or `S-` is truncated at the last legal token rather than discarded, so
 * long inputs do not silently lose detections.
 */
export function decodeBIOESToSpans(
  labels: readonly string[],
  offsets: readonly { start: number; end: number }[]
): PrivacySpan[] {
  const spans: PrivacySpan[] = [];
  let current: { label: string; start: number; end: number } | null = null;

  const closeCurrent = () => {
    if (current && current.end > current.start) {
      spans.push({
        label: current.label,
        start: current.start,
        end: current.end,
        text: "",
        score: 1
      });
    }
    current = null;
  };

  for (let index = 0; index < labels.length; index += 1) {
    const raw = labels[index] ?? "O";
    const offset = offsets[index];
    if (!offset) {
      continue;
    }

    const boundary = raw.slice(0, 2).toUpperCase();
    const label = stripBoundary(raw);
    const supported = SUPPORTED_LABELS.has(label);

    if (!supported || boundary === "O-" || raw.toUpperCase() === "O") {
      closeCurrent();
      continue;
    }

    if (boundary === "B-" || boundary === "S-") {
      closeCurrent();
      current = { label, start: offset.start, end: offset.end };
      if (boundary === "S-") {
        closeCurrent();
      }
      continue;
    }

    if (boundary === "I-" || boundary === "E-") {
      if (current && current.label === label) {
        current.end = offset.end;
      } else {
        // A continuation without a matching opening: treat it as a new span.
        closeCurrent();
        current = { label, start: offset.start, end: offset.end };
      }
      if (boundary === "E-") {
        closeCurrent();
      }
    }
  }

  closeCurrent();
  return spans;
}

/**
 * Drop unsupported, inverted, and overlapping spans. Mirrors the ordering used
 * by the Python `normalize_spans` helper: earliest start, then longest, then
 * highest score.
 */
export function normalizeSpans(text: string, spans: readonly PrivacySpan[]): PrivacySpan[] {
  const length = text.length;
  const candidates: PrivacySpan[] = [];

  for (const span of spans) {
    if (!SUPPORTED_LABELS.has(span.label)) {
      continue;
    }
    const start = Math.max(0, Math.min(span.start, length));
    const end = Math.max(0, Math.min(span.end, length));
    if (end <= start) {
      continue;
    }
    candidates.push({ ...span, start, end, text: text.slice(start, end) });
  }

  candidates.sort(
    (left, right) =>
      left.start - right.start ||
      right.end - right.start - (left.end - left.start) ||
      right.score - left.score
  );

  const accepted: PrivacySpan[] = [];
  let cursor = 0;
  for (const span of candidates) {
    if (span.start < cursor) {
      continue;
    }
    accepted.push(span);
    cursor = span.end;
  }
  return accepted;
}
