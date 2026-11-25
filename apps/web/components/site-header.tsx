import { ReactNode } from "react";

import { Bloom } from "@/components/bloom";
import { SOURCE_URL } from "@/lib/source";

/* App header, not the studio nav: the wordmark goes home to the studio, the
   links stay inside this tool. No red button here; the only red button on
   the page is "Run privacy filter". */
export function SiteHeader(): ReactNode {
  return (
    <header className="site-header">
      <a className="site-brand" href="https://shiftbloom.studio" aria-label="shiftbloom studio home">
        <Bloom className="brand-logo" size={34} variant="solid" />
        <span className="brand-wordmark">
          <span>shiftbloom</span>
          <span className="studio">studio</span>
          <span className="seed">.</span>
        </span>
      </a>
      <nav className="site-nav" aria-label="Main">
        <a href="/#sandbox">Try it</a>
        <a href="/docs">API notes</a>
        <a href={SOURCE_URL}>Source</a>
      </nav>
    </header>
  );
}
