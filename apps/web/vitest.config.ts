import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
      /* Tests run against the package source so the inner loop does not
       * require a dist build. Next.js honors the matching tsconfig paths
       * mapping, so the app compiles from source too; the built dist is what
       * gets published to npm and consumed by Node (see verify:model). */
      "@shiftbloom/privacy-filter": new URL(
        "../../packages/privacy-filter/src/index.ts",
        import.meta.url
      ).pathname
    }
  }
});

