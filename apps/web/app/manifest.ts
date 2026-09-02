import type { MetadataRoute } from "next";

import { defaultDescription, siteName } from "./seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteName,
    short_name: "Privacy Filter",
    description: defaultDescription,
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF2E52",
    categories: ["developer tools", "productivity", "security"],
    icons: [
      {
        src: "/bloom.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
