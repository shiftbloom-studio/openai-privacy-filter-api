import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../seo";

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
          title: "Backend",
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
              <li>AWS App Runner in eu-central-1</li>
              <li>Amazon ECR container images</li>
              <li>GitHub Actions with OIDC-based AWS deployment</li>
              <li>Path-aware API and web redeploy workflow</li>
            </ul>
          )
        }
      ]}
    />
  );
}
