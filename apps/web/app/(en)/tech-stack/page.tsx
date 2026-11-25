import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../../seo";

export const metadata = createPageMetadata({
  title: "Tech Stack",
  description: "Technology stack and deployment components for the OpenAI Privacy Filter Sandbox.",
  path: "/tech-stack",
  imageAlt: "Tech stack for the OpenAI Privacy Filter Sandbox"
});

export default function TechStackPage() {
  return (
    <LegalPage
      eyebrow="Tech Stack"
      title="Tech Stack"
      description="The main open-source and infrastructure components used by this sandbox."
      sections={[
        {
          title: "Frontend",
          body: (
            <ul>
              <li>Next.js 16 App Router</li>
              <li>React 19</li>
              <li>TypeScript</li>
              <li>Vitest and Testing Library</li>
            </ul>
          )
        },
        {
          title: "Backend (optional, self-hosted)",
          body: (
            <ul>
              <li>FastAPI</li>
              <li>Python 3.12 runtime</li>
              <li>openai/privacy-filter model wrapper</li>
              <li>Server-side Next.js proxy at /api/filter</li>
            </ul>
          )
        },
        {
          title: "Deployment",
          body: (
            <ul>
              <li>Static Next.js export on Cloudflare Workers static assets</li>
              <li>Model weights served by the Hugging Face CDN, cached in the browser</li>
              <li>Docker images and an optional AWS App Runner workflow for self-hosters</li>
            </ul>
          )
        }
      ]}
    />
  );
}
