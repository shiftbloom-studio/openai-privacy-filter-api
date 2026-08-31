/**
 * Consent for the in-browser runtime.
 *
 * Loading the model downloads roughly 900 MB of weights from the Hugging Face
 * CDN, so it must not start until the visitor has agreed. Consent is stored
 * locally so returning visitors are not asked again.
 *
 * "Declined" is never persisted: choosing "Not now" is a deferral, not a
 * permanent refusal, and the visitor can reconsider at any time.
 */

export const CONSENT_STORAGE_KEY = "privacy-filter.in-browser-consent.v1";

export type ConsentState = "unknown" | "granted" | "declined";

/** True once the model weights have been accepted. */
export function hasStoredConsent(): boolean {
  return readStoredConsent() === "granted";
}

export function readStoredConsent(): ConsentState {
  if (typeof window === "undefined") {
    return "unknown";
  }
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted" ? "granted" : "unknown";
  } catch {
    // Private browsing modes can throw on storage access. Treat as undecided
    // rather than assuming consent.
    return "unknown";
  }
}

export function storeConsent(): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  } catch {
    // Consent still applies for this session even if it cannot be persisted.
  }
}

export function clearStoredConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/**
 * Approximate one-time download for the q4 variant, weights plus tokenizer.
 * Kept as a constant so the consent copy and the docs cannot drift apart.
 */
export const APPROX_DOWNLOAD_MB = 900;
