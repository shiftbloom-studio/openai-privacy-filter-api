import { ReactNode } from "react";

const studioLinks = [
  { href: "https://shiftbloom.studio/#code", label: "Code" },
  { href: "https://shiftbloom.studio/#art", label: "Art" },
  { href: "https://shiftbloom.studio/#about", label: "Collective" }
];

export function SiteHeader(): ReactNode {
  return (
    <header className="site-header">
      <a className="site-brand" href="https://shiftbloom.studio/#hero" aria-label="Open shiftbloom studio">
        <img
          alt="shiftbloom studio logo"
          className="brand-logo"
          height={40}
          loading="eager"
          src="/logo.png"
          width={40}
        />
        <span className="brand-wordmark">
          <span>shiftbloom</span>
          <strong>studio.</strong>
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
