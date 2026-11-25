import type { Metadata } from "next";

export const siteName = "OpenAI Privacy Filter Sandbox";
export const studioName = "shiftbloom studio";
export const studioUrl = "https://shiftbloom.studio";
export const repoUrl = "https://github.com/shiftbloom-studio/openai-privacy-filter-api";
export const defaultTitle = `${siteName} | ${studioName}`;
export const defaultDescription =
  "Run OpenAI's openai/privacy-filter model in your browser to find names, emails, phone numbers, addresses and secrets in text, then mask or remove them. The text never leaves your device.";

export const keywords = [
  "OpenAI privacy filter",
  "openai/privacy-filter",
  "PII detection",
  "PII redaction",
  "privacy filtering API",
  "AI privacy sandbox",
  "text redaction tool",
  "shiftbloom studio"
];

export const siteUrl = resolveSiteUrl();

export const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "OpenAI Privacy Filter Sandbox by shiftbloom studio"
};

export function createPageMetadata({
  title,
  description,
  path,
  imageAlt = socialImage.alt,
  languages
}: {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
  /** hreflang pairs for pages that exist in English and German. */
  languages?: { en: string; de: string };
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(languages ? { languages: { en: languages.en, de: languages.de, "x-default": languages.en } } : {})
    },
    openGraph: {
      type: "website",
      url: path,
      siteName,
      title,
      description,
      locale: languages && path === languages.de ? "de_DE" : "en_US",
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

/** schema.org graph for the home page, so search engines and AI answer engines
 * can tell what the sandbox does, who publishes it and where the source lives. */
export function structuredData() {
  const home = siteUrl.toString();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${home}#app`,
        name: siteName,
        url: home,
        description: defaultDescription,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        browserRequirements: "WebGPU recommended, WebAssembly fallback. About 900 MB model download on first use.",
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        featureList: [
          "Detects people, emails, phone numbers, addresses, URLs, dates, account numbers and secrets",
          "Mask, remove or annotate detected spans",
          "Runs fully in the browser with Transformers.js"
        ],
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        sameAs: [repoUrl],
        publisher: { "@id": `${studioUrl}/#org` }
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${repoUrl}#code`,
        name: "openai-privacy-filter-api",
        codeRepository: repoUrl,
        programmingLanguage: ["TypeScript", "Python"],
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        publisher: { "@id": `${studioUrl}/#org` }
      },
      {
        "@type": "Organization",
        "@id": `${studioUrl}/#org`,
        name: studioName,
        url: studioUrl
      }
    ]
  };
}
