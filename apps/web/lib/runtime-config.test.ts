import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_FILTER_RUNTIME, isFilterRuntime, resolveFilterRuntime } from "./runtime-config";

describe("runtime-config", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRIVACY_FILTER_RUNTIME;
  });

  it("defaults to the browser runtime so no inference compute is required", () => {
    expect(DEFAULT_FILTER_RUNTIME).toBe("browser");
    expect(resolveFilterRuntime(undefined)).toBe("browser");
  });

  it.each([
    ["browser", "browser"],
    ["server", "server"],
    ["BROWSER", "browser"],
    [" Server ", "server"]
  ])("resolves %s to %s", (input, expected) => {
    expect(resolveFilterRuntime(input)).toBe(expected);
  });

  it("falls back to the default for unknown values", () => {
    expect(resolveFilterRuntime("quantum")).toBe("browser");
    expect(resolveFilterRuntime("")).toBe("browser");
  });

  it.each(["browser", "server"])("validates %s as a runtime", (value) => {
    expect(isFilterRuntime(value)).toBe(true);
  });

  it.each([undefined, null, 42, "nope", {}])("rejects %s as a runtime", (value) => {
    expect(isFilterRuntime(value)).toBe(false);
  });
});
