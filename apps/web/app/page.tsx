import { Bloom } from "@/components/bloom";
import { FilterSandbox } from "@/components/filter-sandbox";
import { SiteHeader } from "@/components/site-header";

import { createPageMetadata } from "./seo";

export const metadata = createPageMetadata({
  title: "OpenAI Privacy Filter Sandbox for PII Redaction",
  description:
    "Test OpenAI's openai/privacy-filter model with browser-based PII detection, redaction modes, detected spans, and server-side API proxying.",
  path: "/"
});

/* Sprinkles: the sky around the flower — margins only, seven at most,
   red or ink only, twinkling staggered at 4–5s intervals. */
const SPRINKLES: Array<{ x: string; y: string; size: number; kind: "spark" | "cross" | "dot"; delay: number }> = [
  { x: "2%", y: "12%", size: 14, kind: "spark", delay: 0 },
  { x: "96%", y: "38%", size: 12, kind: "cross", delay: 0.9 },
  { x: "5%", y: "58%", size: 8, kind: "dot", delay: 1.7 },
  { x: "92%", y: "72%", size: 16, kind: "spark", delay: 2.4 },
  { x: "45%", y: "2%", size: 7, kind: "dot", delay: 3.1 }
];

function Sprinkle({ x, y, size, kind, delay }: (typeof SPRINKLES)[number]) {
  const style = { left: x, top: y, animationDelay: `${delay}s` } as const;
  if (kind === "dot") {
    return (
      <svg className="sprinkle" style={style} width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill="#FF2E52" />
      </svg>
    );
  }
  if (kind === "cross") {
    return (
      <svg className="sprinkle" style={style} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 3 L13 13 M13 3 L3 13" stroke="#1A1216" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="sprinkle" style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#FF2E52" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="extension-shell" id="main-content">
      <SiteHeader />
      <section className="extension-hero" aria-labelledby="page-title">
        <div className="hero-bloom">
          <Bloom className="breathe" size={180} variant="gradient" />
        </div>
        {SPRINKLES.map((sprinkle) => (
          <Sprinkle key={`${sprinkle.x}-${sprinkle.y}`} {...sprinkle} />
        ))}
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
