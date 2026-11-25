#!/usr/bin/env node
/*
 * Post-processes the static export (apps/web/out) for Cloudflare Workers
 * static assets:
 *
 * - Removes the bundled onnxruntime-web WASM binary. Transformers.js loads the
 *   runtime from jsDelivr at run time (env.backends.onnx.wasm.wasmPaths), so
 *   the bundled copy is never requested, and at ~26 MB it exceeds the 25 MiB
 *   per-file limit of Workers static assets.
 * - Writes a `_headers` file with security headers, long-lived caching for
 *   content-hashed build output, and an image type for the extensionless
 *   Open Graph image (link previews ignore it when it is served as binary).
 */
import { readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const outDir = new URL("../apps/web/out/", import.meta.url).pathname;
const MAX_ASSET_BYTES = 25 * 1024 * 1024;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

const tooLarge = [];
for await (const file of walk(outDir)) {
  const { size } = await stat(file);
  const name = relative(outDir, file);
  if (/ort-wasm.*\.wasm$/.test(name)) {
    await rm(file);
    console.log(`removed bundled runtime ${name} (${(size / 1e6).toFixed(1)} MB)`);
  } else if (size > MAX_ASSET_BYTES) {
    tooLarge.push(`${name} (${size} bytes)`);
  }
}

if (tooLarge.length > 0) {
  console.error(`Assets above the 25 MiB Workers limit:\n  ${tooLarge.join("\n  ")}`);
  process.exit(1);
}

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/opengraph-image
  Content-Type: image/png
`;
await writeFile(join(outDir, "_headers"), headers);
console.log("wrote _headers");
