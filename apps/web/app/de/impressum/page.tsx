import { impressumSections } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../../seo";

export const metadata = createPageMetadata({
  title: "Impressum (Deutsch)",
  description: "Impressum der OpenAI Privacy Filter Sandbox.",
  path: "/de/impressum",
  imageAlt: "Impressum der OpenAI Privacy Filter Sandbox"
});

export default function ImpressumDePage() {
  return (
    <LegalPage
      eyebrow="Impressum"
      title="Impressum"
      description="Wer diese Sandbox betreibt und wie du uns erreichst."
      sections={impressumSections("de")}
      lang="de"
      alternate={{ href: "/impressum", label: "English" }}
    />
  );
}
