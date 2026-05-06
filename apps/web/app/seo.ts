import type { Metadata } from "next";

export const siteName = "OpenAI Privacy Filter Sandbox";
export const studioName = "Shiftbloom Studio";
export const defaultTitle = `${siteName} | ${studioName}`;
export const defaultDescription =
  "Test OpenAI's openai/privacy-filter model in a browser sandbox for PII detection, redaction modes, entity spans, and API integration notes.";

export const keywords = [
  "OpenAI privacy filter",
  "openai/privacy-filter",
  "PII detection",
  "PII redaction",
  "privacy filtering API",
  "AI privacy sandbox",
  "text redaction tool",
  "Shiftbloom Studio"
];

export const siteUrl = resolveSiteUrl();

export const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "OpenAI Privacy Filter Sandbox by Shiftbloom Studio"
};

export function createPageMetadata({
  title,
  description,
  path,
  imageAlt = socialImage.alt
}: {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      type: "website",
      url: path,
      siteName,
      title,
      description,
      locale: "en_US",
      images: [
        {
          ...socialImage,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: socialImage.url,
          alt: imageAlt
        }
      ]
    }
  };
}

function resolveSiteUrl() {
  const fallback = "https://privacy.shiftbloom.studio";
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) {
    return new URL(fallback);
  }

  try {
    const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    return new URL(withProtocol);
  } catch {
    return new URL(fallback);
  }
}
