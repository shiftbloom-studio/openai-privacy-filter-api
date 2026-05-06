import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "OpenAI Privacy Filter API Notes",
  description:
    "Review the Shiftbloom sandbox API contract for OpenAI privacy filtering, including endpoints, request fields, redaction modes, and supported labels.",
  path: "/docs",
  imageAlt: "API notes for the OpenAI Privacy Filter Sandbox"
});

const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "Returns service status, configured model, load state, and runtime mode."
  },
  {
    method: "POST",
    path: "/v1/filter",
    description: "Runs text through the privacy filter and returns filtered text plus detected spans."
  }
];

const labels = [
  "account_number",
  "private_address",
  "private_email",
  "private_person",
  "private_phone",
  "private_url",
  "private_date",
  "secret"
];

export default function DocsPage() {
  return (
    <main className="extension-shell docs-shell" id="main-content">
      <section className="docs-hero">
        <div className="extension-topline" aria-label="Documentation context">
          <a className="studio-link" href="/">
            Sandbox
          </a>
          <span className="context-mark">API notes</span>
        </div>
        <h1>Minimal surface. Clear contracts.</h1>
        <p>
          The public sandbox calls a server-side Next.js proxy at <code>/api/filter</code>. The
          underlying FastAPI service is protected for server-side traffic and wraps OpenAI's{" "}
          <a href="https://huggingface.co/openai/privacy-filter">openai/privacy-filter</a> model.
        </p>
      </section>

      <section className="docs-grid" aria-label="API endpoints">
        {endpoints.map((endpoint) => (
          <article className="docs-card" key={endpoint.path}>
            <span className="method">{endpoint.method}</span>
            <h2>{endpoint.path}</h2>
            <p>{endpoint.description}</p>
          </article>
        ))}
      </section>

      <section className="docs-card docs-wide">
        <h2>Filter request</h2>
        <pre className="code-block">
          {`{
  "text": "My name is Alice Smith and my email is alice@example.com.",
  "mode": "mask",
  "mask_token": "[REDACTED]",
  "include_spans": true
}`}
        </pre>
        <p>
          Supported modes are <code>mask</code>, <code>remove</code>, and <code>annotate</code>.
        </p>
      </section>

      <section className="docs-card docs-wide">
        <h2>Supported labels</h2>
        <div className="label-cloud">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
