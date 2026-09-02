import { ReactNode } from "react";

import { Bloom } from "@/components/bloom";

const studioLinks = [
  { href: "https://shiftbloom.studio/#code", label: "Code" },
  { href: "https://shiftbloom.studio/#art", label: "Art" },
  { href: "https://shiftbloom.studio/#about", label: "Collective" }
];

export function SiteHeader(): ReactNode {
  return (
    <header className="site-header">
      <a className="site-brand" href="https://shiftbloom.studio/#hero" aria-label="Open shiftbloom studio">
        <Bloom className="brand-logo" size={34} variant="solid" />
        <span className="brand-wordmark">
          <span>shiftbloom</span>
          <span className="studio">studio</span>
          <span className="seed">.</span>
        </span>
      </a>
      <nav className="site-nav" aria-label="Shiftbloom Studio">
        {studioLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
        <a className="modern-btn nav-cta" href="mailto:hello@shiftbloom.studio">
          Contribute
        </a>
      </nav>
    </header>
  );
}
