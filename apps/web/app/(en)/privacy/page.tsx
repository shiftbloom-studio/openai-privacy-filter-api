import { privacySections } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../../seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for the OpenAI Privacy Filter Sandbox: in-browser processing, hosting and the model download.",
  path: "/privacy",
  languages: { en: "/privacy", de: "/de/datenschutz" },
  imageAlt: "Privacy policy for the OpenAI Privacy Filter Sandbox"
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      description="What happens to your text, who serves this site and what the model download involves."
      sections={privacySections("en")}
      alternate={{ href: "/de/datenschutz", label: "Deutsch" }}
    />
  );
}
