"use client";

import Link from "next/link";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import type { LeaderboardEntry } from "@/lib/binance";
import { formatUsd } from "@/lib/format";
import { DeltaBadge } from "./DeltaBadge";

interface LeaderboardResponse {
  gainers: LeaderboardEntry[];
  losers: LeaderboardEntry[];
  updatedAt: number;
}

export function TopTradersPanel() {
  const { data, error, loading } = usePolledFetch<LeaderboardResponse>(
    "/api/binance/leaderboard",
    15_000
  );

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Top Traders</h2>
        <p className="mt-0.5 max-w-2xl text-[11px] leading-snug text-text-muted">
          No exchange exposes a real &ldquo;most profitable traders&rdquo; feed
          without partner API access, so this shows the real, live stand-in:
          the actual top 24h gainers and losers across all live Binance USDT
          pairs. Click any coin to open it in the Crypto tab&apos;s trade panel.
        </p>
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading live data…</div>}

      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Binance: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
        <LeaderboardColumn title="Top Gainers" entries={data?.gainers ?? []} />
        <LeaderboardColumn title="Top Losers" entries={data?.losers ?? []} />
      </div>
    </div>
  );
}

function LeaderboardColumn({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-hairline bg-surface-1 p-2">
      <h3 className="px-2 py-1 text-xs font-semibold text-text-muted">{title}</h3>
      <ol className="flex flex-col gap-0.5">
        {entries.map((entry, i) => (
          <li key={entry.symbol}>
            <Link
              href={`/?symbol=${entry.symbol}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2"
            >
              <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {entry.label}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {formatUsd(entry.price)} · Vol {formatUsd(entry.quoteVolume, { compact: true })}
                </span>
              </span>
              <DeltaBadge value={entry.changePercent} />
            </Link>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="px-2 py-2 text-xs text-text-muted">No data</li>
        )}
      </ol>
    </div>
  );
}
