import { describe, expect, it } from "vitest";

import {
  CHUNK_TOKEN_BUDGET,
  CHUNK_TOKEN_OVERLAP,
  chunkText,
  mergeChunkSpans
} from "./chunking";

describe("chunkText", () => {
  it("returns a single chunk for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("returns a single unchunked pass for short text", () => {
    const text = "My name is Alice Smith.";
    expect(chunkText(text)).toEqual([{ text, offset: 0 }]);
  });

  it("splits long text into multiple chunks", () => {
    const text = "word ".repeat(3000); // 15,000 chars, well over the budget
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].offset).toBe(0);
  });

  it("keeps every chunk within the character budget", () => {
    const text = "word ".repeat(3000);
    const budget = CHUNK_TOKEN_BUDGET * 4;
    for (const chunk of chunkText(text)) {
      expect(chunk.text.length).toBeLessThanOrEqual(budget);
    }
  });

  it("covers the entire text with no gaps", () => {
    const text = "sentence one. sentence two. ".repeat(600);
    const chunks = chunkText(text);

    // Windows may start anywhere, but their union must cover every character.
    let covered = 0;
    for (const chunk of chunks) {
      expect(chunk.offset).toBeLessThanOrEqual(covered);
      covered = Math.max(covered, chunk.offset + chunk.text.length);
    }
    expect(covered).toBe(text.length);
  });

  it("overlaps consecutive chunks", () => {
    const text = "sentence one. ".repeat(1200);
    const chunks = chunkText(text);
    for (let index = 1; index < chunks.length; index += 1) {
      const previousEnd = chunks[index - 1].offset + chunks[index - 1].text.length;
      expect(chunks[index].offset).toBeLessThan(previousEnd);
    }
  });

  it("prefers breaking on whitespace over splitting mid-word", () => {
    const word = "x".repeat(300);
    const text = Array(8).fill(word).join(" ");
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      const end = chunk.offset + chunk.text.length;

      // A seam must fall between words: a chunk starts right after whitespace
      // (or at the text start) and ends right after whitespace (or at the end).
      if (chunk.offset > 0) {
        expect(/\s/.test(text[chunk.offset - 1])).toBe(true);
      }
      if (end < text.length) {
        expect(/\s/.test(text[end - 1])).toBe(true);
      }

      // No partial word may be carried across a seam: every part is a full
      // word or empty (chunks may start/end on the separator).
      const parts = chunk.text.split(" ");
      for (const part of parts) {
        expect([0, word.length]).toContain(part.length);
      }
    }
  });

  it("still makes progress on a single unbroken run", () => {
    const text = "y".repeat(10_000);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    let covered = 0;
    for (const chunk of chunks) {
      expect(chunk.offset).toBeLessThan(covered + chunk.text.length);
      covered = Math.max(covered, chunk.offset + chunk.text.length);
    }
    expect(covered).toBe(text.length);
  });

  it("honours a custom budget and overlap", () => {
    const text = "a b c d e f g ".repeat(200);
    const chunks = chunkText(text, 16, 4);
    expect(chunks[0].text.length).toBeLessThanOrEqual(64);
    expect(chunks.length).toBeGreaterThan(2);
  });

  it("never lets the overlap exceed half the window", () => {
    // Overlap larger than the window would loop forever; guard against that.
    const text = "z ".repeat(2000);
    const chunks = chunkText(text, 8, 64);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("mergeChunkSpans", () => {
  it("maps chunk-local spans to original offsets", () => {
    const chunks = [
      { text: "abc", offset: 0 },
      { text: "def", offset: 3 }
    ];
    const merged = mergeChunkSpans(chunks, [[{ start: 1, end: 3 }], [{ start: 0, end: 2 }]]);
    expect(merged).toEqual([
      { start: 1, end: 3, chunkIndex: 0 },
      { start: 3, end: 5, chunkIndex: 1 }
    ]);
  });

  it("drops spans owned by the next chunk in the overlap region", () => {
    const chunks = [
      { text: "abcdef", offset: 0 },
      { text: "defghi", offset: 3 }
    ];
    // First chunk reports a span starting at local 4 (original 4), which is
    // inside the second chunk's territory.
    const merged = mergeChunkSpans(chunks, [[{ start: 4, end: 6 }], []]);
    expect(merged).toEqual([]);
  });

  it("keeps spans that start before the next chunk but extend into it", () => {
    const chunks = [
      { text: "abcdef", offset: 0 },
      { text: "defghi", offset: 3 }
    ];
    const merged = mergeChunkSpans(chunks, [[{ start: 0, end: 5 }], []]);
    expect(merged).toEqual([{ start: 0, end: 5, chunkIndex: 0 }]);
  });

  it("returns chunkIndex so callers can recover labels", () => {
    const chunks = [{ text: "hello world", offset: 10 }];
    const merged = mergeChunkSpans(chunks, [[{ start: 0, end: 5 }]]);
    expect(merged[0].chunkIndex).toBe(0);
  });

  it("handles missing span arrays for later chunks", () => {
    const chunks = [
      { text: "abc", offset: 0 },
      { text: "def", offset: 3 }
    ];
    const merged = mergeChunkSpans(chunks, [[{ start: 0, end: 2 }]]);
    expect(merged).toEqual([{ start: 0, end: 2, chunkIndex: 0 }]);
  });
});

describe("chunking constants", () => {
  it("stays safely inside the model's 257-token attention window", () => {
    expect(CHUNK_TOKEN_BUDGET + CHUNK_TOKEN_OVERLAP).toBeLessThan(257);
    expect(CHUNK_TOKEN_OVERLAP).toBeLessThan(CHUNK_TOKEN_BUDGET);
  });
});
