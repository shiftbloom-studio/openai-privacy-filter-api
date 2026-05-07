import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Impressum",
  description: "Legal notice for the Shiftbloom OpenAI Privacy Filter Sandbox.",
  path: "/impressum",
  imageAlt: "Impressum for the OpenAI Privacy Filter Sandbox"
});

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Impressum"
      title="Impressum"
      description="Legal notice for the Shiftbloom OpenAI Privacy Filter Sandbox."
      sections={[
        {
          title: "Operator",
          body: (
            <p>
              Shiftbloom Studio
              <br />
              Represented by Fabian Zimber
              <br />
              Hamburg, Germany
            </p>
          )
        },
        {
          title: "Contact",
          body: (
            <p>
              Email: <a href="mailto:hello@shiftbloom.studio">hello@shiftbloom.studio</a>
              <br />
              Project repository:{" "}
              <a href="https://github.com/shiftbloom-studio/openai-privacy-filter-api">
                github.com/shiftbloom-studio/openai-privacy-filter-api
              </a>
            </p>
          )
        },
        {
          title: "Responsible for content",
          body: <p>Fabian Zimber, Hamburg, Germany.</p>
        },
        {
          title: "Dispute resolution",
          body: (
            <p>
              We are not willing or obliged to participate in dispute resolution proceedings before a
              consumer arbitration board.
            </p>
          )
        }
      ]}
    />
  );
}
