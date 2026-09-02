import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration-style guard for the consent gate.
 *
 * Unlike the unit tests (which mock @shiftbloom/privacy-filter), this test
 * leaves the real browser engine in place and asserts on actual network
 * activity. Its only job is to prove that no model download is attempted until
 * the visitor agrees.
 */

const realFetch = globalThis.fetch;
const modelRequests: string[] = [];

function installStorage(): void {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear()
    }
  });
}

const { FilterSandbox } = await import("./filter-sandbox");

describe("consent gate: no download without agreement", () => {
  beforeEach(() => {
    modelRequests.length = 0;
    installStorage();
    // Never let the real CDN request through; we only record the attempt.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input instanceof Request ? input.url : input);
        if (url.includes("huggingface.co") || url.includes("cdn.jsdelivr.net")) {
          modelRequests.push(url);
          throw new Error(`blocked in test: ${url}`);
        }
        return realFetch(input as RequestInfo, init);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "localStorage");
  });

  it("does not touch the model CDN on mount", async () => {
    render(<FilterSandbox />);

    // Give any stray effect a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(modelRequests).toEqual([]);
  });

  it("does not touch the model CDN after declining", async () => {
    render(<FilterSandbox />);

    fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
    fireEvent.click(await screen.findByRole("button", { name: "Not now" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(modelRequests).toEqual([]);
  });

  it("attempts to load the model only after accepting", async () => {
    render(<FilterSandbox />);

    // Nothing should be loading yet.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
    fireEvent.click(await screen.findByRole("button", { name: /Download and run locally/i }));

    /* A cold cache reaches out to Hugging Face, while a warm cache can load the
     * same artifacts without a network request. In both cases a model status
     * appearing only after acceptance proves that the real engine started. It
     * must then settle back to an enabled button rather than leaving the UI busy. */
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/In-browser model/i)
    );
    await waitFor(
      () => expect(screen.getByRole("button", { name: "Run privacy filter" })).toBeEnabled(),
      { timeout: 10_000 }
    );
  });
});
