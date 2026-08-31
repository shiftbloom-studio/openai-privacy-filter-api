import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPROX_DOWNLOAD_MB,
  CONSENT_STORAGE_KEY,
  clearStoredConsent,
  hasStoredConsent,
  readStoredConsent,
  storeConsent
} from "./consent";

/* jsdom in this environment has no localStorage (Node requires
 * --localstorage-file), so provide an in-memory backing store. */
function installStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear()
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  return store;
}

describe("consent", () => {
  beforeEach(() => {
    installStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "localStorage");
  });

  it("reports unknown consent when nothing is stored", () => {
    expect(hasStoredConsent()).toBe(false);
    expect(readStoredConsent()).toBe("unknown");
  });

  it("remembers consent once granted", () => {
    storeConsent();
    expect(hasStoredConsent()).toBe(true);
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("granted");
  });

  it("can be reset so the visitor is asked again", () => {
    storeConsent();
    clearStoredConsent();
    expect(hasStoredConsent()).toBe(false);
  });

  it("treats unrelated stored values as not consented", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "no");
    expect(hasStoredConsent()).toBe(false);
  });

  it("fails closed when storage access throws", () => {
    const getItem = vi
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });

    expect(hasStoredConsent()).toBe(false);

    getItem.mockRestore();
  });

  it("does not throw when consent cannot be persisted", () => {
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });

    expect(() => storeConsent()).not.toThrow();

    setItem.mockRestore();
  });

  it("documents a realistic download size", () => {
    // The q4 weights are ~874 MB plus a ~26 MB tokenizer.
    expect(APPROX_DOWNLOAD_MB).toBeGreaterThanOrEqual(800);
    expect(APPROX_DOWNLOAD_MB).toBeLessThanOrEqual(1000);
  });
});
