import { FilterSandbox } from "@/components/filter-sandbox";

import { createPageMetadata } from "./seo";

export const metadata = createPageMetadata({
  title: "OpenAI Privacy Filter Sandbox for PII Redaction",
  description:
    "Test OpenAI's openai/privacy-filter model with browser-based PII detection, redaction modes, detected spans, and server-side API proxying.",
  path: "/"
});

export default function Home() {
  return (
    <main className="extension-shell" id="main-content">
      <section className="extension-hero" aria-labelledby="page-title">
        <div className="extension-topline" aria-label="Project context">
          <a className="studio-link" href="https://shiftbloom.studio">
            shiftbloom.studio
          </a>
        </div>
        <h1>
          Privacy filter <span>sandbox.</span>
        </h1>
        <p className="extension-copy">
          A focused Shiftbloom testing surface for{" "}
          <a href="https://huggingface.co/openai/privacy-filter">openai/privacy-filter</a>, a
          privacy-detection model created by OpenAI. Paste sample text, choose a redaction mode, and
          inspect the model response without leaving the sandbox.
        </p>
        <div className="extension-actions">
          <a className="modern-btn" href="#sandbox">
            Open sandbox
          </a>
          <a className="tertiary-btn" href="/docs">
            API notes
          </a>
        </div>
      </section>

      <FilterSandbox />
    </main>
  );
}
