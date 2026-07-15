"use client";

import { useCopyMirrorEngine } from "@/hooks/useCopyMirrorEngine";

/** Mounted once in the root layout so followed traders keep auto-mirroring across tabs. */
export function CopyMirrorRunner() {
  useCopyMirrorEngine();
  return null;
}
