/**
 * Chunking for the in-browser runtime.
 *
 * `openai/privacy-filter` uses banded attention with band size 128, giving an
 * effective attention window of 257 tokens including self. Text longer than that
 * would silently lose detections, so long input is split into overlapping
 * windows and the per-chunk spans are mapped back to original text offsets.
 */

/** Leave headroom below the 257-token window for the tokenizer's special tokens. */
export const CHUNK_TOKEN_BUDGET = 192;

/** Overlap so a span straddling a boundary is still seen whole in one window. */
export const CHUNK_TOKEN_OVERLAP = 48;

export type TextChunk = {
  text: string;
  /** Character offset of `text` within the original string. */
  offset: number;
};

/** Rough characters-per-token ratio, used only to size windows without a tokenizer. */
const CHARS_PER_TOKEN = 4;

/**
 * Split text into overlapping chunks. Pure and tokenizer-free: it works on a
 * conservative characters-per-token estimate, so it is testable in isolation.
 *
 * Chunks break on whitespace where possible to avoid splitting mid-word, but
 * never exceed the character budget derived from the token budget.
 */
export function chunkText(
  text: string,
  tokenBudget: number = CHUNK_TOKEN_BUDGET,
  tokenOverlap: number = CHUNK_TOKEN_OVERLAP
): TextChunk[] {
  if (text.length === 0) {
    return [];
  }

  const maxChars = Math.max(1, tokenBudget * CHARS_PER_TOKEN);
  if (text.length <= maxChars) {
    return [{ text, offset: 0 }];
  }

  const overlapChars = Math.max(0, Math.min(tokenOverlap * CHARS_PER_TOKEN, Math.floor(maxChars / 2)));
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const breakAt = findBreakPoint(text, start, end);

    chunks.push({ text: text.slice(start, breakAt), offset: start });

    if (breakAt >= text.length) {
      break;
    }

    // Step back so the next window overlaps this one, then align to a word
    // boundary so neither window splits a word at its seam.
    const nextStart = alignToWordStart(text, Math.max(start + 1, breakAt - overlapChars), breakAt);
    start = nextStart;
  }

  return chunks;
}

/**
 * Advance `candidate` to the first word boundary in `[candidate, limit]`.
 *
 * `limit` (the previous chunk's break point) is itself always a boundary, so
 * the search always succeeds — falling through to it only costs overlap in
 * pathologically long words, never correctness. Unbroken runs with no
 * whitespace at all return `candidate` unchanged, keeping the loop progressing.
 */
function alignToWordStart(text: string, candidate: number, limit: number): number {
  for (let index = candidate; index <= limit; index += 1) {
    if (/\s/.test(text[index - 1] ?? "")) {
      return index;
    }
  }
  return candidate;
}

/**
 * Choose a chunk end at or before `hardEnd`, preferring the last whitespace so
 * words are not split. Falls back to `hardEnd` for very long unbroken runs.
 */
function findBreakPoint(text: string, start: number, hardEnd: number): number {
  if (hardEnd >= text.length) {
    return text.length;
  }

  const searchFrom = Math.max(start + Math.floor((hardEnd - start) / 2), start + 1);
  for (let index = hardEnd; index >= searchFrom; index -= 1) {
    if (/\s/.test(text[index - 1] ?? "")) {
      return index;
    }
  }

  return hardEnd;
}

/**
 * Map spans produced for a chunk back to original-text coordinates and drop any
 * that fall in the overlap region of a later chunk, so overlapping windows do
 * not yield duplicate spans.
 *
 * Each returned entry carries the index of the chunk it came from, so the
 * caller can recover the original label and score.
 */
export function mergeChunkSpans(
  chunks: readonly TextChunk[],
  spansPerChunk: ReadonlyArray<ReadonlyArray<{ start: number; end: number }>>
): Array<{ start: number; end: number; chunkIndex: number }> {
  const merged: Array<{ start: number; end: number; chunkIndex: number }> = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const spans = spansPerChunk[index] ?? [];
    const nextChunk = chunks[index + 1];

    for (const span of spans) {
      const start = chunk.offset + span.start;
      const end = chunk.offset + span.end;

      // Spans starting at or after the next chunk's start are owned by it.
      if (nextChunk && start >= nextChunk.offset) {
        continue;
      }

      merged.push({ start, end, chunkIndex: index });
    }
  }

  return merged;
}
