// Final E2E: cached model -> per-token output -> production tokensToSpans
// (with whitespace trim) -> redaction. Verifies the trimmed output reads
// "is [REDACTED]," not "is[REDACTED],".
import { pipeline } from "@huggingface/transformers";

const TEXT =
  "My name is Alice Smith, my email is alice@example.com, and my project key is sk-1234567890abcdef.";

const ner = await pipeline("token-classification", "openai/privacy-filter", {
  device: "cpu",
  dtype: "q4"
});
const tokens = await ner(TEXT, { ignore_labels: ["O"] });

function stripBoundary(label) {
  const trimmed = label.trim();
  if (trimmed.toUpperCase() === "O") return "O";
  const cleaned = trimmed.toLowerCase();
  for (const p of ["b-", "i-", "e-", "s-"]) {
    if (cleaned.startsWith(p)) return cleaned.slice(p.length);
  }
  return cleaned;
}

function tokensToSpans(tokens, text) {
  const spans = [];
  let cursor = 0;
  let open = null;
  const close = () => {
    if (open && open.end > open.start) {
      let start = open.start;
      let end = open.end;
      while (start < end && /\s/.test(text[start])) start += 1;
      while (end > start && /\s/.test(text[end - 1])) end -= 1;
      if (end > start) {
        spans.push({ label: open.label, start, end, text: text.slice(start, end), score: open.score });
      }
    }
    open = null;
  };
  for (const token of tokens) {
    const rawEntity = String(token.entity ?? token.entity_group ?? "");
    if (!rawEntity || rawEntity === "O") { close(); continue; }
    const boundary = rawEntity.slice(0, 2);
    const label = stripBoundary(rawEntity);
    const score = Math.max(0, Math.min(1, Number(token.score ?? 0)));
    const word = String(token.word ?? "");
    const found = word ? text.indexOf(word, cursor) : -1;
    if (found < 0) { close(); continue; }
    const start = found;
    const end = found + word.length;
    cursor = end;
    if (boundary === "B-" || boundary === "S-") {
      close();
      open = { label, start, end, score };
      if (boundary === "S-") close();
    } else if (boundary === "I-" || boundary === "E-") {
      if (open && open.label === label) {
        open.end = end;
        open.score = Math.min(open.score, score);
      } else {
        close();
        open = { label, start, end, score };
      }
      if (boundary === "E-") close();
    } else {
      close();
    }
  }
  close();
  return spans;
}

const spans = tokensToSpans(tokens, TEXT);
console.log("=== SPANS ===");
for (const s of spans) {
  const ok = TEXT.slice(s.start, s.end) === s.text ? "OK" : "MISMATCH";
  console.log(`${s.label} [${s.start},${s.end}] "${s.text}" ${ok}`);
}

function applyRedaction(text, spans, mode, maskToken) {
  const pieces = [];
  let cursor = 0;
  for (const s of spans) {
    pieces.push(text.slice(cursor, s.start));
    if (mode === "remove") pieces.push("");
    else if (mode === "annotate") pieces.push(`[${s.label}:${text.slice(s.start, s.end)}]`);
    else pieces.push(maskToken);
    cursor = s.end;
  }
  pieces.push(text.slice(cursor));
  return pieces.join("");
}

console.log("\n=== MASKED (trim aktiv) ===");
console.log(applyRedaction(TEXT, spans, "mask", "[REDACTED]"));
console.log("EXIT OK");
