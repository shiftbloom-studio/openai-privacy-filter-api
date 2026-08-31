import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const browserEngine = vi.hoisted(() => ({
  detectSpansInBrowser: vi.fn(),
  loadBrowserEngine: vi.fn()
}));

const runtimeConfig = vi.hoisted(() => ({
  getFilterRuntime: vi.fn<() => "server" | "browser">()
}));

vi.mock("@/lib/browser-engine", () => browserEngine);
vi.mock("@/lib/runtime-config", () => runtimeConfig);

const { FilterSandbox } = await import("./filter-sandbox");

const BROWSER_SPANS = [
  {
    label: "private_email",
    start: 6,
    end: 23,
    text: "alice@example.com",
    score: 0.98
  }
];

describe("FilterSandbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeConfig.getFilterRuntime.mockReturnValue("server");
    browserEngine.loadBrowserEngine.mockResolvedValue({});
    browserEngine.detectSpansInBrowser.mockResolvedValue(BROWSER_SPANS);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("server runtime", () => {
    it("validates empty input before submitting", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<FilterSandbox />);

      fireEvent.change(screen.getByLabelText("Input text"), { target: { value: " " } });
      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(
        await screen.findByText("Enter text before running the privacy filter.")
      ).toBeVisible();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
    });

    it("renders filtered text and spans after a successful response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              original_text: "Email alice@example.com",
              filtered_text: "Email [REDACTED]",
              spans: BROWSER_SPANS,
              model: "openai/privacy-filter"
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" }
            }
          )
        )
      );
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      await waitFor(() => expect(screen.getByText("private_email")).toBeVisible());
      expect(screen.getByText("[REDACTED]")).toBeVisible();
      expect(screen.getByText("Model: openai/privacy-filter")).toBeVisible();
    });

    it("surfaces upstream errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: "Privacy filter API is unreachable." }), {
            status: 502,
            headers: { "content-type": "application/json" }
          })
        )
      );
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(
        await screen.findByText("Privacy filter API is unreachable.")
      ).toBeVisible();
    });
  });

  describe("browser runtime", () => {
    beforeEach(() => {
      runtimeConfig.getFilterRuntime.mockReturnValue("browser");
    });

    it("runs the model in-browser and never calls the server proxy", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      await waitFor(() => expect(screen.getByText("private_email")).toBeVisible());
      expect(browserEngine.detectSpansInBrowser).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("renders redacted output for the sample text", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      await waitFor(() => expect(screen.getByText("[REDACTED]")).toBeVisible());
    });

    it("reports a failure when the in-browser model throws", async () => {
      vi.stubGlobal("fetch", vi.fn());
      browserEngine.detectSpansInBrowser.mockRejectedValue(new Error("Model could not be loaded."));
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(await screen.findByText("Model could not be loaded.")).toBeVisible();
    });

    it("validates empty input before invoking the browser model", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<FilterSandbox />);

      fireEvent.change(screen.getByLabelText("Input text"), { target: { value: " " } });
      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(
        await screen.findByText("Enter text before running the privacy filter.")
      ).toBeVisible();
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
    });
  });
});
