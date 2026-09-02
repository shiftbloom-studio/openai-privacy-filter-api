#!/usr/bin/env node
/**
 * Real-model smoke test for the browser engine package.
 *
 * Downloads the actual openai/privacy-filter weights (~900 MB on first run,
 * then served from the Hugging Face cache), classifies a sample text, converts
 * the per-token output with the production tokensToSpans + chunking pipeline,
 * and redacts it. Exits non-zero when the expected spans are missing.
 *
 * Usage: npm run build --workspace @shiftbloom/privacy-filter && npm run verify:model
 */
import { pipeline } from "@huggingface/transformers";

import {
  MODEL_ID,
  applyRedaction,
  chunkText,
  mergeChunkSpans,
  normalizeSpans,
  tokensToSpans
} from "@shiftbloom/privacy-filter";

const TEXT =
  "My name is Alice Smith, my email is alice@example.com, and I live in Berlin.";

const classifier = await pipeline("token-classification", MODEL_ID, {
  device: "cpu",
  dtype: "q4"
});

const chunks = chunkText(TEXT);
const spansPerChunk = [];
for (const chunk of chunks) {
  const tokens = await classifier(chunk.text, { ignore_labels: ["O"] });
  spansPerChunk.push(tokensToSpans(Array.isArray(tokens) ? tokens : [], chunk.text));
}
const merged = mergeChunkSpans(chunks, spansPerChunk);
const spans = normalizeSpans(
  TEXT,
  merged
    .map(({ start, end, chunkIndex }) => {
      const local = spansPerChunk[chunkIndex].find(
        (span) =>
          span.start === start - chunks[chunkIndex].offset &&
          span.end === end - chunks[chunkIndex].offset
      );
      return local ? { ...local, start, end } : null;
    })
    .filter(Boolean)
);

console.log("=== SPANS ===");
for (const span of spans) {
  const ok = TEXT.slice(span.start, span.end) === span.text ? "OK" : "MISMATCH";
  console.log(`${span.label} [${span.start},${span.end}] "${span.text}" ${ok}`);
}

const [filtered] = applyRedaction(TEXT, spans, "mask", "[REDACTED]");
console.log("\n=== MASKED ===");
console.log(filtered);

const labels = new Set(spans.map((span) => span.label));
const expected = ["private_person", "private_email"];
const missing = expected.filter((label) => !labels.has(label));
if (missing.length > 0 || spans.some((span) => TEXT.slice(span.start, span.end) !== span.text)) {
  console.error(`\nVERIFY FAILED: missing labels ${missing.join(", ") || "none"}`);
  process.exit(1);
}
console.log("\nVERIFY OK");
