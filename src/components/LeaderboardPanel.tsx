"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { formatUsd, type LeaderboardEntry } from "@/lib/binance";
import { DeltaBadge } from "./DeltaBadge";

interface LeaderboardResponse {
  gainers: LeaderboardEntry[];
  losers: LeaderboardEntry[];
  updatedAt: number;
}

type Tab = "gainers" | "losers";

export function LeaderboardPanel({
  onSelectSymbol,
}: {
  onSelectSymbol: (symbol: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("gainers");
  const { data, error, loading } = usePolledFetch<LeaderboardResponse>(
    "/api/binance/leaderboard",
    15_000
  );

  const entries = data?.[tab] ?? [];

  return (
    <section className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">24h Leaderboard</h2>
        <div className="flex rounded-md border border-border-hairline bg-surface-1 p-0.5 text-xs">
          <TabButton active={tab === "gainers"} onClick={() => setTab("gainers")}>
            Gainers
          </TabButton>
          <TabButton active={tab === "losers"} onClick={() => setTab("losers")}>
            Losers
          </TabButton>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-text-muted">
        Real 24h % movers across all live Binance USDT pairs — the closest
        keyless stand-in for a &ldquo;most profitable&rdquo; leaderboard.
      </p>

      {loading && !data && (
        <div className="text-xs text-text-muted">Loading live data…</div>
      )}

      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Binance: {error}
        </div>
      )}

      <ol className="flex flex-col gap-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {entries.map((entry, i) => (
          <li key={entry.symbol}>
            <button
              onClick={() => onSelectSymbol(entry.symbol)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2"
            >
              <span className="w-4 shrink-0 text-xs tabular-nums text-text-muted">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {entry.label}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {formatUsd(entry.price)}
                </span>
              </span>
              <DeltaBadge value={entry.changePercent} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 transition-colors ${
        active ? "bg-surface-2 text-text-primary" : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}
