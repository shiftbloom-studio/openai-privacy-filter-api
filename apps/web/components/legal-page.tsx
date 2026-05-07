import { ReactNode } from "react";

import { SiteHeader } from "./site-header";

type LegalSection = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  sections
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
}): ReactNode {
  return (
    <main className="extension-shell legal-shell" id="main-content">
      <SiteHeader />
      <section className="legal-hero">
        <div className="extension-topline" aria-label="Legal page context">
          <a className="studio-link" href="/">
            Sandbox
          </a>
          <span className="context-mark">{eyebrow}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="legal-grid" aria-label={`${title} details`}>
        {sections.map((section) => (
          <article className="docs-card legal-card" key={section.title}>
            <h2>{section.title}</h2>
            <div>{section.body}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
