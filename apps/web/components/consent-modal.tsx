"use client";

import { ReactNode, useEffect, useRef } from "react";

import { APPROX_DOWNLOAD_MB } from "@/lib/consent";

type ConsentModalProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps): ReactNode {
  const acceptRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    acceptRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDecline();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      // Keep focus inside the dialog while it is open.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    // Prevent the page behind the dialog from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onDecline]);

  if (!open) {
    return null;
  }

  return (
    <div className="consent-backdrop" role="presentation" onClick={onDecline}>
      <div
        aria-describedby="consent-description"
        aria-labelledby="consent-title"
        aria-modal="true"
        className="consent-dialog"
        ref={dialogRef}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="consent-eyebrow">Runs in your browser</p>
        <h2 className="consent-title" id="consent-title">
          Download the privacy filter model?
        </h2>
        <div className="consent-body" id="consent-description">
          <p>
            This sandbox runs the {`"openai/privacy-filter"`} model entirely on your device. Nothing
            you type is uploaded — but the model weights are downloaded once, about{" "}
            <strong>{APPROX_DOWNLOAD_MB} MB</strong>, and cached by your browser for future visits.
          </p>
          <ul className="consent-list">
            <li>
              <strong>Your text stays on your device.</strong> There is no server-side inference and
              no request carrying what you type.
            </li>
            <li>
              <strong>One download of about {APPROX_DOWNLOAD_MB} MB.</strong> Consider this on a
              metered or mobile connection.
            </li>
            <li>
              <strong>Requires WebGPU or WebGL.</strong> Without either, the sandbox cannot run here.
            </li>
          </ul>
          <p className="consent-note">
            Prefer not to download anything? The API behind this demo is open source — you can
            self-host it instead.
          </p>
        </div>
        <div className="consent-actions">
          <button className="primary-button" onClick={onAccept} ref={acceptRef} type="button">
            Download and run locally
          </button>
          <button className="ghost-button" onClick={onDecline} type="button">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
