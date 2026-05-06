"use client";

import { FormEvent, ReactNode, useState } from "react";

import {
  FILTER_MODES,
  FilterMode,
  FilterResponse,
  PrivacySpan,
  spanKey,
  validateFilterRequest
} from "@/lib/privacy-filter";

const EXAMPLE_TEXT =
  "My name is Alice Smith, my email is alice@example.com, and my project key is sk-live-secret.";

export function FilterSandbox(): ReactNode {
  const [text, setText] = useState(EXAMPLE_TEXT);
  const [mode, setMode] = useState<FilterMode>("mask");
  const [maskToken, setMaskToken] = useState("[REDACTED]");
  const [includeSpans, setIncludeSpans] = useState(true);
  const [result, setResult] = useState<FilterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitFilter(event: FormEvent<HTMLFormElement>) {
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

    setIsLoading(true);
    setError(null);

    try {
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

      setResult(payload as FilterResponse);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

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
            <button className="primary-button" disabled={isLoading} type="submit">
              {isLoading ? "Filtering..." : "Run privacy filter"}
            </button>
            <button className="ghost-button" type="button" onClick={() => setText(EXAMPLE_TEXT)}>
              Load sample
            </button>
          </div>
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
              <p>Results appear here after the API responds.</p>
            </div>
          )}
        </div>
      </form>
    </section>
  );
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
