import { ReactNode } from "react";

import { SOURCE_URL } from "@/lib/source";

const links = {
  en: [
    { href: "/privacy", label: "Privacy" },
    { href: "/impressum", label: "Imprint" },
    { href: "/tech-stack", label: "Tech stack" },
    { href: "/de/datenschutz", label: "Deutsch" }
  ],
  de: [
    { href: "/de/datenschutz", label: "Datenschutz" },
    { href: "/de/impressum", label: "Impressum" },
    { href: "/privacy", label: "English" }
  ]
};

export function SiteFooter({ lang = "en" }: { lang?: "en" | "de" }): ReactNode {
  const de = lang === "de";
  return (
    <footer className="site-footer" aria-label={de ? "Rechtliches und Projekt" : "Legal and project information"}>
      <div className="footer-inner">
        <div className="footer-copy">
          <strong>
            <a href="https://shiftbloom.studio">
              shiftbloom <span className="studio">studio</span>
              <span className="seed-period">.</span>
            </a>
          </strong>
          <span>
            {de ? "Open Source unter AGPL-3.0-or-later. " : "Open source under AGPL-3.0-or-later. "}
            <a href={SOURCE_URL}>{de ? "Zum Code" : "Read the code"}</a>
          </span>
        </div>
        <nav className="footer-links" aria-label={de ? "Rechtliche Links" : "Legal links"}>
          {links[lang].map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="footer-fineprint">
        {de
          ? "Kein Angebot von OpenAI und nicht mit OpenAI verbunden. Das Modell openai/privacy-filter stammt von OpenAI und steht unter Apache-2.0."
          : "Not made by or affiliated with OpenAI. The openai/privacy-filter model is OpenAI's work, released under Apache-2.0."}
      </p>
    </footer>
  );
}
