import type { NextConfig } from "next";

/*
 * PRIVACY_FILTER_STATIC_EXPORT=1 builds a fully static site (`out/`) for the
 * browser runtime, e.g. for Cloudflare Workers static assets. The server-side
 * proxy route lives in `route.server.ts`, which is only picked up when the
 * `server.ts` page extension is enabled, so static builds skip it.
 */
const staticExport = process.env.PRIVACY_FILTER_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: staticExport ? ["tsx", "ts"] : ["server.ts", "tsx", "ts"],
  ...(staticExport ? { output: "export", images: { unoptimized: true } } : {})
};

export default nextConfig;
