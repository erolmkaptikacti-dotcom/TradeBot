"use client";

import { useStrategyEngine } from "@/hooks/useStrategyEngine";

/** Mounted once in the root layout so strategies keep evaluating across tabs. */
export function StrategyEngineRunner() {
  useStrategyEngine();
  return null;
}
