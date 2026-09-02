import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHUNK_TOKEN_BUDGET } from "./chunking";
import type { TokenClassificationToken } from "./engine";
import type { LoadProgress } from "./engine";

const classifyMock = vi.fn<(text: string, options?: Record<string, unknown>) => Promise<TokenClassificationToken[]>>();
const pipelineMock = vi.fn();

vi.mock("@huggingface/transformers", () => ({
  pipeline: (...args: unknown[]) => pipelineMock(...args),
  env: { allowLocalModels: true }
}));

const {
  activeBrowserDevice,
  detectSpansInBrowser,
  loadBrowserEngine,
  resetBrowserEngineForTests
} = await import("./engine");

const EMAIL = "alice@example.com";

/**
 * Answer like the real model: emit an S-tag for every email literally present
 * in the chunk the classifier was called with.
 */
function answerWithEmails(text: string): TokenClassificationToken[] {
  const tokens: TokenClassificationToken[] = [];
  let cursor = 0;
  while (true) {
    const found = text.indexOf(EMAIL, cursor);
    if (found < 0) {
      break;
    }
    tokens.push({ entity: "S-private_email", word: EMAIL, score: 0.99, index: tokens.length });
    cursor = found + EMAIL.length;
  }
  return tokens;
}

beforeEach(() => {
  classifyMock.mockReset();
  pipelineMock.mockReset();
  resetBrowserEngineForTests();
  pipelineMock.mockResolvedValue(classifyMock);
  classifyMock.mockImplementation(async (text: string) => answerWithEmails(text));
});

describe("loadBrowserEngine", () => {
  it("forwards loading and ready progress events", async () => {
    const events: LoadProgress[] = [];
    await loadBrowserEngine({ onProgress: (progress) => events.push(progress) });

    expect(events[0]).toMatchObject({ stage: "loading" });
    expect(events.at(-1)).toMatchObject({ stage: "ready", percent: 100 });
  });

  it("falls back to the next device when the preferred one fails", async () => {
    pipelineMock
      .mockRejectedValueOnce(new Error("no webgpu adapter"))
      .mockResolvedValueOnce(classifyMock);

    await loadBrowserEngine({ preferredDevice: "webgpu" });

    expect(pipelineMock).toHaveBeenCalledTimes(2);
    expect(activeBrowserDevice()).toBe("wasm");
  });

  it("reports an error stage and clears the slot so a retry is possible", async () => {
    const events: LoadProgress[] = [];
    pipelineMock.mockRejectedValue(new Error("offline"));

    await expect(
      loadBrowserEngine({ onProgress: (progress) => events.push(progress) })
    ).rejects.toThrow("offline");
    expect(events.at(-1)).toMatchObject({ stage: "error" });

    // The slot is cleared: a retry calls the pipeline factory again.
    pipelineMock.mockResolvedValue(classifyMock);
    await loadBrowserEngine();
    expect(activeBrowserDevice()).not.toBeNull();
  });
});

describe("detectSpansInBrowser", () => {
  it("runs a single classifier pass for short text", async () => {
    const text = `Reach me at ${EMAIL} tomorrow.`;
    const spans = await detectSpansInBrowser(text);

    expect(classifyMock).toHaveBeenCalledTimes(1);
    expect(classifyMock.mock.calls[0][0]).toBe(text);
    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({ label: "private_email", text: EMAIL });
    expect(text.slice(spans[0].start, spans[0].end)).toBe(EMAIL);
  });

  it("chunks long text and maps spans back to original offsets", async () => {
    const filler = "lorem ipsum dolor sit amet ".repeat(200); // 5,400 chars
    const text = `${filler} contact ${EMAIL} ${filler}`;
    const spans = await detectSpansInBrowser(text);

    expect(classifyMock.mock.calls.length).toBeGreaterThan(1);
    const budget = CHUNK_TOKEN_BUDGET * 4;
    for (const call of classifyMock.mock.calls) {
      expect((call[0] as string).length).toBeLessThanOrEqual(budget);
    }

    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe(EMAIL);
    expect(text.slice(spans[0].start, spans[0].end)).toBe(EMAIL);
    expect(spans[0].start).toBe(text.indexOf(EMAIL));
  });

  it("does not duplicate a span seen by two overlapping chunks", async () => {
    // Place the email so it is guaranteed to sit inside an overlap region:
    // near the first chunk boundary (~768 chars).
    const head = "a".repeat(700) + " ";
    const tail = " " + "b".repeat(700);
    const text = `${head}${EMAIL}${tail}`;
    const spans = await detectSpansInBrowser(text);

    expect(classifyMock.mock.calls.length).toBeGreaterThan(1);
    const emailSpans = spans.filter((span) => span.text === EMAIL);
    expect(emailSpans).toHaveLength(1);
  });
});
