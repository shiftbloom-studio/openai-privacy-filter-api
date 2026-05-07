import { ReactNode } from "react";

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/tech-stack", label: "Tech Stack" }
];

export function SiteFooter(): ReactNode {
  return (
    <footer className="site-footer" aria-label="Legal and project information">
      <div className="footer-inner">
        <div className="footer-copy">
          <strong>shiftbloom studio.</strong>
          <span>OpenAI Privacy Filter Sandbox</span>
          <span>Hamburg, Germany</span>
        </div>
        <nav className="footer-links" aria-label="Legal links">
          {legalLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="footer-fineprint">
        © {new Date().getFullYear()} shiftbloom studio. All rights reserved.
      </p>
    </footer>
  );
}
