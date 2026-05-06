import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl, validateFilterRequest } from "./privacy-filter";

describe("privacy filter helpers", () => {
  it("normalizes trailing slashes from API base URLs", () => {
    expect(normalizeApiBaseUrl("https://api.example.com///")).toBe("https://api.example.com");
  });

  it("rejects blank text", () => {
    expect(
      validateFilterRequest({
        text: " ",
        mode: "mask",
        mask_token: "[REDACTED]",
        include_spans: true
      })
    ).toBe("Enter text before running the privacy filter.");
  });

  it("accepts a complete request", () => {
    expect(
      validateFilterRequest({
        text: "Email alice@example.com",
        mode: "mask",
        mask_token: "[REDACTED]",
        include_spans: true
      })
    ).toBeNull();
  });
});

