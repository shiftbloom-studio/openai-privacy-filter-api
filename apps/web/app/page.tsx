import { FilterSandbox } from "@/components/filter-sandbox";
import { SiteHeader } from "@/components/site-header";

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
      <SiteHeader />
      <section className="extension-hero" aria-labelledby="page-title">
        <h1 className="extension-headline" id="page-title">
          <span className="headline-word">OpenAI privacy filter</span>
          <span className="headline-accent">sandbox.</span>
        </h1>
        <p className="extension-copy">
          A focused testing surface for{" "}
          <a href="https://huggingface.co/openai/privacy-filter">openai/privacy-filter</a>, a
          privacy-detection model created by OpenAI. Paste sample text, choose a redaction mode, and
          inspect the model response without leaving the sandbox.
        </p>
        <div className="extension-actions">
          <a className="tertiary-btn" href="/docs">
            API notes
          </a>
        </div>
      </section>

      <FilterSandbox />
    </main>
  );
}
