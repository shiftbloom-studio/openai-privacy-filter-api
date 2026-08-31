import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const browserEngine = vi.hoisted(() => ({
  detectSpansInBrowser: vi.fn(),
  loadBrowserEngine: vi.fn()
}));

const runtimeConfig = vi.hoisted(() => ({
  getFilterRuntime: vi.fn<() => "server" | "browser">()
}));

const consent = vi.hoisted(() => ({
  hasStoredConsent: vi.fn<() => boolean>(),
  storeConsent: vi.fn()
}));

vi.mock("@/lib/browser-engine", () => browserEngine);
vi.mock("@/lib/runtime-config", () => runtimeConfig);
vi.mock("@/lib/consent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/consent")>();
  return {
    ...actual,
    hasStoredConsent: consent.hasStoredConsent,
    storeConsent: consent.storeConsent
  };
});

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
    consent.hasStoredConsent.mockReturnValue(true);
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

    it("does not ask for consent in the server runtime", async () => {
      vi.stubGlobal("fetch", vi.fn());
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("browser runtime", () => {
    beforeEach(() => {
      runtimeConfig.getFilterRuntime.mockReturnValue("browser");
    });

    it("runs the model in-browser and never calls the server proxy", async () => {
      consent.hasStoredConsent.mockReturnValue(true);
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      await waitFor(() => expect(screen.getByText("private_email")).toBeVisible());
      expect(browserEngine.detectSpansInBrowser).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("renders redacted output for the sample text", async () => {
      consent.hasStoredConsent.mockReturnValue(true);
      vi.stubGlobal("fetch", vi.fn());
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      await waitFor(() => expect(screen.getByText("[REDACTED]")).toBeVisible());
    });

    it("reports a failure when the in-browser model throws", async () => {
      consent.hasStoredConsent.mockReturnValue(true);
      vi.stubGlobal("fetch", vi.fn());
      browserEngine.detectSpansInBrowser.mockRejectedValue(new Error("Model could not be loaded."));
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(await screen.findByText("Model could not be loaded.")).toBeVisible();
    });

    it("validates empty input before invoking the browser model", async () => {
      consent.hasStoredConsent.mockReturnValue(true);
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

  describe("consent gate", () => {
    beforeEach(() => {
      runtimeConfig.getFilterRuntime.mockReturnValue("browser");
      consent.hasStoredConsent.mockReturnValue(false);
    });

    it("does not load the model on mount without consent", () => {
      render(<FilterSandbox />);

      expect(browserEngine.loadBrowserEngine).not.toHaveBeenCalled();
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
    });

    it("asks for consent instead of filtering when nothing is stored", async () => {
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
    });

    it("discloses the download size and local execution", async () => {
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent(/900 MB/);
      expect(dialog).toHaveTextContent(/stays on your device/i);
    });

    it("starts the download and runs the filter after consent", async () => {
      consent.hasStoredConsent.mockReturnValue(false);
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
      fireEvent.click(await screen.findByRole("button", { name: /Download and run locally/i }));

      await waitFor(() => expect(browserEngine.detectSpansInBrowser).toHaveBeenCalled());
      expect(consent.storeConsent).toHaveBeenCalled();
      expect(await screen.findByText("private_email")).toBeVisible();
    });

    it("downloads nothing when the visitor declines", async () => {
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
      fireEvent.click(await screen.findByRole("button", { name: "Not now" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
      expect(consent.storeConsent).not.toHaveBeenCalled();
    });

    it("closes on Escape without downloading", async () => {
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
      await screen.findByRole("dialog");
      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(browserEngine.detectSpansInBrowser).not.toHaveBeenCalled();
      expect(consent.storeConsent).not.toHaveBeenCalled();
    });

    it("re-asks on the next attempt after declining", async () => {
      render(<FilterSandbox />);

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
      fireEvent.click(await screen.findByRole("button", { name: "Not now" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });
});
