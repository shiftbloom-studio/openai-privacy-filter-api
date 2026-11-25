import type { ReactNode } from "react";

import { RootShell, sharedMetadata, sharedViewport } from "../root-shell";

export const metadata = sharedMetadata;
export const viewport = sharedViewport;

export default function GermanLayout({ children }: { children: ReactNode }) {
  return <RootShell lang="de">{children}</RootShell>;
}
