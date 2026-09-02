import { describe, expect, it } from "vitest";

import { tokensToSpans, type TokenClassificationToken } from "./engine";

/* Token fixtures mirror the real @huggingface/transformers@4.2.0 per-token
 * output for openai/privacy-filter, captured from a verified model run:
 * tokens carry BIOES tags and `word` with leading whitespace preserved. */

const TEXT =
  "My name is Alice Smith, my email is alice@example.com, and my project key is sk-1234567890abcdef.";

function token(entity: string, word: string, score = 0.9999): TokenClassificationToken {
  return { entity, word, score, index: 0 };
}

describe("tokensToSpans", () => {
  it("groups a B/I/E sequence into one span with exact offsets", () => {
    const tokens = [
      token("B-private_person", " Alice"),
      token("E-private_person", " Smith")
    ];
    const spans = tokensToSpans(tokens, TEXT);

    expect(spans).toHaveLength(1);
    expect(spans[0].label).toBe("private_person");
    expect(spans[0].text).toBe("Alice Smith");
    expect(TEXT.slice(spans[0].start, spans[0].end)).toBe("Alice Smith");
  });

  it("decodes a single-token S-tag span at the very start of the text", () => {
    // Real tokenizer shape: the first token's word has no leading space.
    const tokens = [token("S-private_person", "My")];
    const spans = tokensToSpans(tokens, TEXT);
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe("My");
    expect(spans[0].start).toBe(0);
  });

  it("reconstructs multi-token email spans (verified real-model shape)", () => {
    const tokens = [
      token("B-private_email", " alice"),
      token("I-private_email", "@example"),
      token("E-private_email", ".com")
    ];
    const spans = tokensToSpans(tokens, TEXT);
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe("alice@example.com");
  });

  it("trims leading/trailing whitespace off span boundaries", () => {
    const tokens = [token("B-private_person", " Alice"), token("E-private_person", " Smith")];
    const spans = tokensToSpans(tokens, TEXT);
    // The B token word is " Alice" — the span must not include that space.
    expect(spans[0].text.startsWith(" ")).toBe(false);
  });

  it("closes a span when the label changes mid-sequence", () => {
    const tokens = [
      token("B-private_person", " Alice"),
      token("B-secret", " sk-1234567890abcdef")
    ];
    const spans = tokensToSpans(tokens, TEXT);
    expect(spans.map((s) => s.label)).toEqual(["private_person", "secret"]);
  });

  it("skips background and unlocatable tokens without drifting offsets", () => {
    const tokens = [
      token("O", "My"),
      token("B-private_person", " Alice"),
      token("E-private_person", " Smith"),
      token("B-secret", "sk-does-not-exist-in-text"),
      token("S-private_email", " alice@example.com")
    ];
    const spans = tokensToSpans(tokens, TEXT);
    // The unlocatable token closes the open span; the email is still found.
    expect(spans.map((s) => s.text)).toEqual(["Alice Smith", "alice@example.com"]);
  });

  it("keeps the minimum score across tokens in a span", () => {
    const tokens = [
      token("B-secret", " sk", 0.99),
      token("E-secret", "-1234567890abcdef", 0.5)
    ];
    const spans = tokensToSpans(tokens, TEXT);
    expect(spans[0].score).toBeCloseTo(0.5, 5);
  });

  it("returns no spans for empty token input", () => {
    expect(tokensToSpans([], TEXT)).toEqual([]);
  });

  it("handles an I-tag without an opening B-tag as a new span", () => {
    const tokens = [token("I-private_person", " Smith")];
    const spans = tokensToSpans(tokens, TEXT);
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe("Smith");
  });
});
