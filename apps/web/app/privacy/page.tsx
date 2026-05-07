import { LegalPage } from "@/components/legal-page";

import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy notice for the Shiftbloom OpenAI Privacy Filter Sandbox, including sandbox text processing and hosting information.",
  path: "/privacy",
  imageAlt: "Privacy policy for the OpenAI Privacy Filter Sandbox"
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      description="How this sandbox handles submitted text, request metadata, and service operation."
      sections={[
        {
          title: "Controller",
          body: (
            <p>
              Shiftbloom Studio, represented by Fabian Zimber, Hamburg, Germany.
              <br />
              Email: <a href="mailto:hello@shiftbloom.studio">hello@shiftbloom.studio</a>
            </p>
          )
        },
        {
          title: "Sandbox text processing",
          body: (
            <p>
              When you submit text to the sandbox, the browser sends it to the Next.js server route
              at <code>/api/filter</code>. That route forwards the request to the server-side
              FastAPI privacy filter service and returns the model response to your browser. The
              application code does not persist submitted text.
            </p>
          )
        },
        {
          title: "Infrastructure and metadata",
          body: (
            <p>
              The current deployment runs on AWS App Runner in the <code>eu-central-1</code> region.
              Operational logs and platform telemetry may include technical request metadata such as
              timestamps, status codes, and IP-derived network information. Do not submit production
              secrets or unnecessary personal data to this public sandbox.
            </p>
          )
        },
        {
          title: "Model and third parties",
          body: (
            <p>
              The service wraps OpenAI&apos;s open-source{" "}
              <a href="https://huggingface.co/openai/privacy-filter">openai/privacy-filter</a>{" "}
              model. Requests are processed by the deployed server-side service; the browser does
              not call the model API directly.
            </p>
          )
        },
        {
          title: "Cookies and analytics",
          body: (
            <p>
              This sandbox does not set application cookies and does not include account, newsletter,
              or advertising flows. Static assets and service requests may still be handled by the
              hosting infrastructure required to operate the service.
            </p>
          )
        },
        {
          title: "GDPR / DSGVO rights",
          body: (
            <p>
              If personal data relating to you is processed, you may have rights of access,
              rectification, erasure, restriction, portability, objection, and complaint with a
              supervisory authority under the GDPR / DSGVO. Contact{" "}
              <a href="mailto:hello@shiftbloom.studio">hello@shiftbloom.studio</a> for privacy
              requests.
            </p>
          )
        },
        {
          title: "Last updated",
          body: <p>May 7, 2026.</p>
        }
      ]}
    />
  );
}
