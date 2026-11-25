import { privacySections } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../../seo";

export const metadata = createPageMetadata({
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung der OpenAI Privacy Filter Sandbox: Verarbeitung im Browser, Hosting und Modell-Download.",
  path: "/de/datenschutz",
  imageAlt: "Datenschutzerklärung der OpenAI Privacy Filter Sandbox"
});

export default function DatenschutzPage() {
  return (
    <LegalPage
      eyebrow="Datenschutz"
      title="Datenschutzerklärung"
      description="Was mit deinem Text passiert, wer diese Seite ausliefert und was der Modell-Download bedeutet."
      sections={privacySections("de")}
      lang="de"
      alternate={{ href: "/privacy", label: "English" }}
    />
  );
}
