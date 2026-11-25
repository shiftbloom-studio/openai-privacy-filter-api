import { RootShell, sharedMetadata, sharedViewport } from "./root-shell";

export const metadata = { ...sharedMetadata, title: "Page not found", robots: { index: false } };
export const viewport = sharedViewport;

/* With two root layouts there is no shared layout to render a 404 inside,
   so this page brings its own <html>. */
export default function GlobalNotFound() {
  return (
    <RootShell lang="en">
      <main className="extension-shell" id="main-content">
        <h1>This page does not exist.</h1>
        <p>
          <a href="/">Back to the sandbox</a>
        </p>
      </main>
    </RootShell>
  );
}
