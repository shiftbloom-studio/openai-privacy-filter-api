import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("filter proxy route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects invalid payloads before calling upstream", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/filter", {
        method: "POST",
        body: JSON.stringify({ text: "", mode: "mask", mask_token: "[REDACTED]" })
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards valid payloads to the configured API", async () => {
    vi.stubEnv("PRIVACY_FILTER_API_URL", "https://privacy-api.example.com/");
    vi.stubEnv("PRIVACY_FILTER_INTERNAL_TOKEN", "internal-secret");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          original_text: "Email alice@example.com",
          filtered_text: "Email [REDACTED]",
          spans: [],
          model: "openai/privacy-filter"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/filter", {
        method: "POST",
        body: JSON.stringify({
          text: "Email alice@example.com",
          mode: "mask",
          mask_token: "[REDACTED]",
          include_spans: true
        })
      })
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://privacy-api.example.com/v1/filter",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-privacy-filter-internal-token": "internal-secret"
        }),
        method: "POST"
      })
    );
  });
});
