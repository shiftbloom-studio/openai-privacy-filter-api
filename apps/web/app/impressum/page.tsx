import { impressumSections } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Impressum",
  description: "Legal notice for the OpenAI Privacy Filter Sandbox.",
  path: "/impressum",
  imageAlt: "Impressum for the OpenAI Privacy Filter Sandbox"
});

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Legal notice"
      title="Impressum"
      description="Who runs this sandbox and how to reach them."
      sections={impressumSections("en")}
      alternate={{ href: "/de/impressum", label: "Deutsch" }}
    />
  );
}
