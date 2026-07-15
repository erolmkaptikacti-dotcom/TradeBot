"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { formatUsd } from "@/lib/format";
import {
  formatCents,
  polymarketProfileUrl,
  shortAddress,
  traderDisplayName,
  WINDOW_LABELS,
  type LeaderboardWindow,
  type PolymarketPosition,
  type PolymarketTrader,
} from "@/lib/polymarket";

interface LeadersResponse {
  leaders: PolymarketTrader[];
  window: LeaderboardWindow;
  demo: boolean;
  reason?: string;
  updatedAt: number;
}

interface PositionsResponse {
  positions: PolymarketPosition[];
  demo: boolean;
}

export function PolymarketLeaderboardPanel() {
  const [window, setWindow] = useState<LeaderboardWindow>("7d");
  const { data, error, loading } = usePolledFetch<LeadersResponse>(
    `/api/polymarket/leaders?window=${window}`,
    30_000
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-text-primary">
              Polymarket Leaderboard
            </h1>
            {data &&
              (data.demo ? (
                <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-status-warning">
                  DEMO DATA
                </span>
              ) : (
                <span className="rounded-full bg-status-good/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-status-good">
                  LIVE
                </span>
              ))}
          </div>
          <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-text-muted">
            {data?.demo
              ? "Simulated Polymarket traders and their recent activity. Live data flows through the same view once Polymarket's API is reachable."
              : "Real Polymarket wallets ranked by profit. Click on any trader to view their current positions and activity."}
          </p>
          {data?.demo && data.reason && (
            <p className="mt-0.5 max-w-xl text-[10px] leading-snug text-text-muted/70">
              {data.reason}
            </p>
          )}
        </div>
        <div className="flex rounded-md border border-border-hairline bg-surface-0 p-0.5 text-xs">
          {(Object.keys(WINDOW_LABELS) as LeaderboardWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => {
                setWindow(w);
                setExpanded(null);
              }}
              className={`rounded px-2 py-1 transition-colors ${
                window === w
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading leaderboard…</div>}
      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Polymarket: {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {data?.leaders.map((trader, i) => (
          <TraderRow
            key={trader.address}
            rank={i + 1}
            trader={trader}
            demo={data.demo}
            expanded={expanded === trader.address}
            onToggle={() =>
              setExpanded(expanded === trader.address ? null : trader.address)
            }
          />
        ))}
      </div>
    </div>
  );
}

function TraderRow({
  rank,
  trader,
  demo,
  expanded,
  onToggle,
}: {
  rank: number;
  trader: PolymarketTrader;
  demo: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-hairline bg-surface-1 shadow-[var(--shadow-card)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="w-6 shrink-0 text-xs tabular-nums text-text-muted">#{rank}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-primary">
            {traderDisplayName(trader)}
          </span>
          <span className="block font-mono text-[11px] text-text-muted">
            {shortAddress(trader.address)}
          </span>
        </span>
        <span className="min-w-fit text-right">
          <span className="block text-[11px] text-text-muted">Vol</span>
          <span className="text-sm font-medium text-text-primary">
            {formatUsd(trader.volume, { compact: true })}
          </span>
        </span>
        <span className="min-w-fit text-right">
          <span className="block text-[11px] text-text-muted">P&L</span>
          <span
            className={`text-sm font-semibold tabular-nums ${
              trader.pnl >= 0 ? "text-status-good" : "text-status-critical"
            }`}
          >
            {trader.pnl >= 0 ? "+" : ""}
            {formatUsd(trader.pnl, { compact: true })}
          </span>
        </span>
        <span className="text-text-muted">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && <TraderActivity trader={trader} demo={demo} />}
    </div>
  );
}

function TraderActivity({ trader, demo }: { trader: PolymarketTrader; demo: boolean }) {
  const { data, loading, error } = usePolledFetch<PositionsResponse>(
    `/api/polymarket/positions?user=${encodeURIComponent(trader.address)}${demo ? "&demo=1" : ""}`,
    20_000
  );

  const positions = data?.positions ?? [];

  return (
    <div className="border-t border-border-hairline px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <a
          href={polymarketProfileUrl(trader.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-muted underline decoration-dotted hover:text-text-secondary"
        >
          View on Polymarket →
        </a>
        <span className="text-[11px] text-text-muted">
          {positions.length} open position{positions.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading positions…</div>}
      {error && <div className="text-xs text-status-critical">Couldn&apos;t load positions</div>}

      <ul className="flex flex-col gap-2">
        {positions.map((p) => (
          <li
            key={`${p.marketId}:${p.outcome}`}
            className="rounded-lg border border-border-hairline bg-surface-0 px-3 py-2.5 text-xs"
          >
            <div className="mb-1 block truncate text-text-primary font-medium">
              {p.question}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-muted">
                {p.shares.toLocaleString()} × {p.outcome}
              </span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-text-muted">Entry</div>
                  <div className="tabular-nums text-text-secondary">{formatCents(p.avgPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-text-muted">Current</div>
                  <div className="tabular-nums text-text-secondary">{formatCents(p.currentPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-text-muted">P&L</div>
                  <PnlBadge entry={p.avgPrice} current={p.currentPrice} shares={p.shares} />
                </div>
              </div>
            </div>
          </li>
        ))}
        {!loading && positions.length === 0 && (
          <li className="text-xs text-text-muted">No open positions</li>
        )}
      </ul>
    </div>
  );
}

function PnlBadge({
  entry,
  current,
  shares,
}: {
  entry: number;
  current: number;
  shares: number;
}) {
  const pnl = (current - entry) * shares;

  return (
    <div
      className={`tabular-nums ${
        pnl >= 0 ? "text-status-good" : "text-status-critical"
      }`}
    >
      {pnl >= 0 ? "+" : ""}
      {formatUsd(pnl)}
    </div>
  );
}
