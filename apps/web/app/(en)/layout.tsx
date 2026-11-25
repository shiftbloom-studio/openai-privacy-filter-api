import type { ReactNode } from "react";

import { RootShell, sharedMetadata, sharedViewport } from "../root-shell";

export const metadata = sharedMetadata;
export const viewport = sharedViewport;

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
