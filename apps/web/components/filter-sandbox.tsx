"use client";

import { FormEvent, ReactNode, useState } from "react";

import { ConsentModal } from "@/components/consent-modal";
import { hasStoredConsent, storeConsent } from "@/lib/consent";
import { getFilterRuntime } from "@/lib/runtime-config";
import {
  FILTER_MODES,
  MODEL_ID,
  type FilterMode,
  type FilterResponse,
  type LoadProgress,
  type PrivacySpan,
  applyRedaction,
  detectSpansInBrowser,
  spanKey,
  validateFilterRequest
} from "@shiftbloom-studio/privacy-filter";

const EXAMPLE_TEXT =
  "My name is Alice Smith, my email is alice@example.com, and I live in Berlin.";

type Runtime = "server" | "browser";

type PendingRequest = {
  text: string;
  mode: FilterMode;
  mask_token: string;
  include_spans: boolean;
};

export function FilterSandbox(): ReactNode {
  const [text, setText] = useState(EXAMPLE_TEXT);
  const [mode, setMode] = useState<FilterMode>("mask");
  const [maskToken, setMaskToken] = useState("[REDACTED]");
  const [includeSpans, setIncludeSpans] = useState(true);
  const [result, setResult] = useState<FilterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [runtime] = useState<Runtime>(getFilterRuntime);
  const [modelProgress, setModelProgress] = useState<LoadProgress | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);

  function acceptConsent() {
    storeConsent();
    setConsentOpen(false);
    const request = pendingRequest;
    setPendingRequest(null);
    if (request) {
      void executeFilter(request);
    }
  }

  function declineConsent() {
    setConsentOpen(false);
    setPendingRequest(null);
  }

  async function executeFilter(request: PendingRequest) {
    setIsLoading(true);
    setError(null);

    try {
      setResult(
        await runFilter(request, runtime, (progress) => {
          setModelProgress(progress);
        })
      );
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = {
      text,
      mode,
      mask_token: maskToken,
      include_spans: includeSpans
    };

    const validationError = validateFilterRequest(request);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    // Ask before the first download, then remember the answer.
    if (runtime === "browser" && !hasStoredConsent()) {
      setPendingRequest(request);
      setConsentOpen(true);
      return;
    }

    void executeFilter(request);
  }

  const browserBusy =
    runtime === "browser" && modelProgress !== null && modelProgress.stage === "loading";

  return (
    <section className="sandbox-workbench" id="sandbox" aria-label="Privacy filter test harness">
      <form className="sandbox-grid" onSubmit={submitFilter}>
        <div className="panel input-panel">
          <div className="panel-title">
            <span>01</span>
            <h3>Input</h3>
          </div>
          <label htmlFor="privacy-text">Input text</label>
          <textarea
            id="privacy-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste text containing emails, names, phone numbers, URLs, dates, or secrets."
          />
          <div className="control-row">
            <label htmlFor="filter-mode">Mode</label>
            <select
              id="filter-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as FilterMode)}
            >
              {FILTER_MODES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="control-row">
            <label htmlFor="mask-token">Mask token</label>
            <input
              id="mask-token"
              value={maskToken}
              onChange={(event) => setMaskToken(event.target.value)}
            />
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={includeSpans}
              onChange={(event) => setIncludeSpans(event.target.checked)}
            />
            Include detected spans
          </label>
          <div className="actions">
            <button
              className="primary-button"
              disabled={isLoading || browserBusy}
              type="submit"
            >
              {browserBusy
                ? "Loading model..."
                : isLoading
                  ? "Filtering..."
                  : "Run privacy filter"}
            </button>
            <button className="ghost-button" type="button" onClick={() => setText(EXAMPLE_TEXT)}>
              Load sample
            </button>
          </div>
          {runtime === "browser" && modelProgress ? (
            <p className="runtime-note" role="status">
              {modelProgress.stage === "loading"
                ? `In-browser model: ${modelProgress.detail}`
                : modelProgress.stage === "ready"
                  ? `In-browser model ${modelProgress.detail} — text never leaves your device.`
                  : "In-browser model unavailable. Reload to retry."}
            </p>
          ) : null}
          {error ? <p className="error-message">{error}</p> : null}
        </div>

        <div className="panel output-panel" aria-live="polite">
          <div className="panel-title">
            <span>02</span>
            <h3>Output</h3>
          </div>
          {result ? (
            <>
              <div className="result-block">
                <p className="result-label">Filtered text</p>
                <div className="filtered-text">
                  <HighlightedText text={result.filtered_text} spans={result.spans} />
                </div>
              </div>
              <div className="result-block">
                <p className="result-label">Detected spans</p>
                {result.spans.length > 0 ? (
                  <ul className="span-list">
                    {result.spans.map((span) => (
                      <li key={spanKey(span)}>
                        <strong>{span.label}</strong>
                        <span>{span.text}</span>
                        <em>{Math.round(span.score * 100)}%</em>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No spans returned for this request.</p>
                )}
              </div>
              <p className="model-note">Model: {result.model}</p>
            </>
          ) : (
            <div className="placeholder">
              <span>infinity</span>
              <p>
                {runtime === "browser"
                  ? "Results appear here once the in-browser model is ready."
                  : "Results appear here after the API responds."}
              </p>
            </div>
          )}
        </div>
      </form>
      <ConsentModal onAccept={acceptConsent} onDecline={declineConsent} open={consentOpen} />
    </section>
  );
}

async function runFilter(
  request: PendingRequest,
  runtime: Runtime,
  onProgress?: (progress: LoadProgress) => void
): Promise<FilterResponse> {
  if (runtime === "browser") {
    const spans = await detectSpansInBrowser(request.text, { onProgress });
    return buildResponse(request, spans);
  }

  const response = await fetch("/api/filter", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(request)
  });

  const payload = (await response.json()) as FilterResponse | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Request failed.");
  }

  return payload as FilterResponse;
}

/**
 * Build the response in the browser so both runtimes produce an identical
 * contract. Mirrors the Python `apply_redaction` behaviour.
 */
function buildResponse(
  request: { text: string; mode: FilterMode; mask_token: string; include_spans: boolean },
  spans: PrivacySpan[]
): FilterResponse {
  const [filteredText, selectedSpans] = applyRedaction(
    request.text,
    spans,
    request.mode,
    request.mask_token
  );

  return {
    original_text: request.text,
    filtered_text: filteredText,
    spans: request.include_spans ? selectedSpans : [],
    model: MODEL_ID
  };
}

function HighlightedText({ text, spans }: { text: string; spans: PrivacySpan[] }): ReactNode {
  if (spans.length === 0) {
    return text;
  }

  const pieces: ReactNode[] = [];
  let cursor = 0;

  for (const span of [...spans].sort((left, right) => left.start - right.start)) {
    const replacementIndex = text.indexOf("[REDACTED]", cursor);
    if (replacementIndex === -1) {
      break;
    }

    if (replacementIndex > cursor) {
      pieces.push(text.slice(cursor, replacementIndex));
    }

    pieces.push(
      <mark key={spanKey(span)} title={span.text}>
        [REDACTED]
      </mark>
    );
    cursor = replacementIndex + "[REDACTED]".length;
  }

  pieces.push(text.slice(cursor));
  return pieces;
}
