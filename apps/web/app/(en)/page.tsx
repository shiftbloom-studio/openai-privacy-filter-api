import { FilterSandbox } from "@/components/filter-sandbox";
import { SiteHeader } from "@/components/site-header";

import { createPageMetadata } from "@/app/seo";

export const metadata = createPageMetadata({
  title: "OpenAI Privacy Filter Sandbox for PII Redaction",
  description:
    "Run OpenAI's openai/privacy-filter model in your browser to find names, emails, phone numbers, addresses and secrets in text, then mask or remove them. The text never leaves your device.",
  path: "/"
});

/* Sprinkles: the sky around the flower — margins only, seven at most,
   red or ink only, twinkling staggered at 4–5s intervals. */
const SPRINKLES: Array<{ x: string; y: string; size: number; kind: "spark" | "cross" | "dot"; delay: number }> = [
  { x: "-3%", y: "8%", size: 14, kind: "spark", delay: 0 },
  { x: "97%", y: "18%", size: 12, kind: "cross", delay: 0.9 },
  { x: "-2%", y: "70%", size: 8, kind: "dot", delay: 1.7 },
  { x: "99%", y: "64%", size: 16, kind: "spark", delay: 2.4 }
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
        {SPRINKLES.map((sprinkle) => (
          <Sprinkle key={`${sprinkle.x}-${sprinkle.y}`} {...sprinkle} />
        ))}
        <h1 className="extension-headline" id="page-title">
          <span className="headline-word">OpenAI privacy filter,</span>{" "}
          <span className="headline-accent">in your browser.</span>
        </h1>
        <p className="extension-copy">
          Paste an email, a chat log or a support ticket. OpenAI&apos;s open{" "}
          <a href="https://huggingface.co/openai/privacy-filter">privacy-filter</a> model marks
          names, addresses, phone numbers, account numbers and secrets, and you decide whether to
          mask, remove or label them. The model runs on your device, so nothing you paste is
          uploaded.
        </p>
        <p className="hero-example" aria-label="Example output">
          <span className="hero-example-label">Example</span>
          Hi, I&apos;m <mark>[private_person]</mark>, call me on <mark>[private_phone]</mark> or
          write to <mark>[private_email]</mark>.
        </p>
      </section>

      <FilterSandbox />
    </main>
  );
}
