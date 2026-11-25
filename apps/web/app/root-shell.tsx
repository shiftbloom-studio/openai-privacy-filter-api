import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/site-footer";

import "./globals.css";
import {
  defaultDescription,
  defaultTitle,
  keywords,
  siteName,
  siteUrl,
  socialImage,
  structuredData,
  studioName,
  studioUrl
} from "./seo";

/* Three voices, one register (Brand Book v2.0):
   Clash Display = statements · General Sans = explaining · JetBrains Mono = truth. */
const clashDisplay = localFont({
  src: "../fonts/clash-display/ClashDisplay-Variable.woff2",
  variable: "--font-clash",
  weight: "400 700",
  display: "swap"
});

const generalSans = localFont({
  src: "../fonts/general-sans/GeneralSans-Variable.woff2",
  variable: "--font-general",
  weight: "400 600",
  display: "swap"
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains",
  weight: "400 700",
  display: "swap"
});

/* Shared by the two root layouts, app/(en) and app/de, which exist only so
   that <html lang> matches the language of each page. */
export const sharedMetadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: defaultTitle,
    template: `%s | ${studioName}`
  },
  description: defaultDescription,
  applicationName: siteName,
  authors: [{ name: studioName, url: studioUrl }],
  creator: studioName,
  publisher: studioName,
  keywords,
  category: "Developer tools",
  classification: "AI privacy filtering sandbox",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [
      { url: "/bloom.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    locale: "en_US",
    images: [socialImage]
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: socialImage.url, alt: socialImage.alt }]
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default"
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false
  }
};

export const sharedViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light"
};

export function RootShell({ lang, children }: { lang: "en" | "de"; children: ReactNode }) {
  return (
    /* The font variables must sit on <html>: globals.css composes --font-display,
       --font-sans and --font-mono on :root, and a var() that is undefined there
       makes the composed value invalid for the whole page. */
    <html lang={lang} className={`${clashDisplay.variable} ${generalSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // JSON.stringify output is safe here: the graph holds only static strings.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c") }}
        />
        {children}
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
