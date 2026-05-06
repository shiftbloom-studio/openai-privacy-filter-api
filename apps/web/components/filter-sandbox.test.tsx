import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterSandbox } from "./filter-sandbox";

describe("FilterSandbox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates empty input before submitting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<FilterSandbox />);

    fireEvent.change(screen.getByLabelText("Input text"), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Run privacy filter" }));

    expect(await screen.findByText("Enter text before running the privacy filter.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders filtered text and spans after a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            original_text: "Email alice@example.com",
            filtered_text: "Email [REDACTED]",
            spans: [
              {
                label: "private_email",
                start: 6,
                end: 23,
                text: "alice@example.com",
                score: 0.98
              }
            ],
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
});

