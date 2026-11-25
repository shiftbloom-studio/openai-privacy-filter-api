import type { MetadataRoute } from "next";

import { siteUrl } from "./seo";

export const dynamic = "force-static";

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
  },
  {
    path: "/impressum",
    changeFrequency: "yearly",
    priority: 0.5
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.5
  },
  {
    path: "/de/impressum",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/de/datenschutz",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/tech-stack",
    changeFrequency: "monthly",
    priority: 0.5
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
