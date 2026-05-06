import type { MetadataRoute } from "next";

import { siteUrl } from "./seo";

const routes = [
  {
    path: "/",
    changeFrequency: "monthly",
    priority: 1
  },
  {
    path: "/docs",
    changeFrequency: "monthly",
    priority: 0.8
  }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
