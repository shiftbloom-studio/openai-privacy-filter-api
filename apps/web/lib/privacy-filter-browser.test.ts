import { describe, expect, it } from "vitest";

import { applyRedaction } from "@/lib/privacy-filter";
import type { PrivacySpan } from "@/lib/privacy-filter";
import {
  ID_TO_LABEL,
  decodeBIOESToSpans,
  normalizeSpans,
  stripBoundary
} from "@/lib/privacy-filter-browser";

function offsets(pairs: ReadonlyArray<readonly [number, number]>) {
  return pairs.map(([start, end]) => ({ start, end }));
}

function span(label: string, start: number, end: number, score = 1): PrivacySpan {
  return { label, start, end, text: "", score };
}

describe("stripBoundary", () => {
  it.each([
    ["B-private_person", "private_person"],
    ["I-private_person", "private_person"],
    ["E-private_person", "private_person"],
    ["S-private_person", "private_person"],
    ["O", "O"],
    ["private_person", "private_person"]
  ])("strips the BIOES prefix from %s", (input, expected) => {
    expect(stripBoundary(input)).toBe(expected);
  });
});

describe("ID_TO_LABEL", () => {
  it("has 33 classes: O plus 8 labels x 4 boundary tags", () => {
    expect(ID_TO_LABEL).toHaveLength(33);
    expect(ID_TO_LABEL[0]).toBe("O");
  });

  it("matches the model's id2label ordering", () => {
    expect(ID_TO_LABEL.slice(0, 5)).toEqual([
      "O",
      "B-account_number",
      "I-account_number",
      "E-account_number",
      "S-account_number"
    ]);
  });
});

describe("decodeBIOESToSpans", () => {
  it("decodes a single-token span", () => {
    const spans = decodeBIOESToSpans(
      ["O", "S-private_email", "O"],
      offsets([
        [0, 1],
        [1, 5],
        [5, 6]
      ])
    );
    expect(spans).toEqual([span("private_email", 1, 5)]);
  });

  it("decodes a multi-token begin/inside/end span", () => {
    const spans = decodeBIOESToSpans(
      ["B-private_person", "I-private_person", "E-private_person"],
      offsets([
        [0, 5],
        [6, 8],
        [9, 14]
      ])
    );
    expect(spans).toEqual([span("private_person", 0, 14)]);
  });

  it("closes a span that never reaches an end tag", () => {
    const spans = decodeBIOESToSpans(
      ["B-private_person", "I-private_person"],
      offsets([
        [0, 5],
        [6, 8]
      ])
    );
    expect(spans).toEqual([span("private_person", 0, 8)]);
  });

  it("starts a new span when a different label interrupts", () => {
    const spans = decodeBIOESToSpans(
      ["B-private_person", "B-private_email"],
      offsets([
        [0, 5],
        [6, 10]
      ])
    );
    expect(spans.map((s) => [s.label, s.start, s.end])).toEqual([
      ["private_person", 0, 5],
      ["private_email", 6, 10]
    ]);
  });

  it("ignores background and unknown labels", () => {
    const spans = decodeBIOESToSpans(["O", "O"], offsets([[0, 1], [1, 2]]));
    expect(spans).toEqual([]);
  });
});

describe("normalizeSpans", () => {
  it("drops unsupported labels", () => {
    expect(normalizeSpans("hello", [span("not_a_label", 0, 5)])).toEqual([]);
  });

  it("clamps spans to the text bounds", () => {
    const result = normalizeSpans("hello", [span("private_person", 2, 99)]);
    expect(result[0]).toMatchObject({ start: 2, end: 5, text: "llo" });
  });

  it("keeps the longest span when two overlap", () => {
    const result = normalizeSpans("abcdef", [span("private_person", 0, 2), span("private_person", 0, 5)]);
    expect(result).toHaveLength(1);
    expect(result[0].end).toBe(5);
  });

  it("keeps non-overlapping spans in order", () => {
    const result = normalizeSpans("a b c", [span("private_person", 4, 5), span("private_email", 0, 1)]);
    expect(result.map((s) => s.label)).toEqual(["private_email", "private_person"]);
  });
});

describe("applyRedaction", () => {
  const spans = [span("private_email", 6, 23)];

  it("masks with the mask token", () => {
    const [text] = applyRedaction("Email alice@example.com here", spans, "mask", "[REDACTED]");
    expect(text).toBe("Email [REDACTED] here");
  });

  it("removes the span", () => {
    const [text] = applyRedaction("Email alice@example.com here", spans, "remove", "[REDACTED]");
    expect(text).toBe("Email  here");
  });

  it("annotates with the label and value", () => {
    const [text] = applyRedaction("Email alice@example.com here", spans, "annotate", "[REDACTED]");
    expect(text).toBe("Email [private_email:alice@example.com] here");
  });

  it("leaves text untouched when no span is selected", () => {
    const [text] = applyRedaction("nothing here", [], "mask", "[REDACTED]");
    expect(text).toBe("nothing here");
  });
});
