"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { formatUsd } from "@/lib/format";
import {
  formatCents,
  polymarketProfileUrl,
  traderDisplayName,
  WINDOW_LABELS,
  type LeaderboardWindow,
  type PolymarketPosition,
  type PolymarketTrader,
} from "@/lib/polymarket";
import { useCopyTradingStore } from "@/store/copyTradingStore";
import { DeltaBadge } from "./DeltaBadge";

interface LeadersResponse {
  leaders: PolymarketTrader[];
  window: LeaderboardWindow;
  demo: boolean;
  updatedAt: number;
}

const COPY_BUDGET = 100; // virtual USDC per manual "copy" action

export function CopyTradingPanel() {
  const [window, setWindow] = useState<LeaderboardWindow>("7d");
  const { data, error, loading } = usePolledFetch<LeadersResponse>(
    `/api/polymarket/leaders?window=${window}`,
    30_000
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary">
                Most Profitable Traders
              </h2>
              {data?.demo && (
                <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-status-warning">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-text-muted">
              {data?.demo
                ? "Simulated Polymarket traders and positions — copying mirrors them into a paper wallet, no real money. Live data flows through the same UI once Polymarket's API is reachable."
                : "Live Polymarket wallets ranked by profit. Copy their real open positions into your paper wallet — simulated, no real money or wallet needed."}
            </p>
          </div>
          <div className="flex rounded-md border border-border-hairline bg-surface-0 p-0.5 text-xs">
            {(Object.keys(WINDOW_LABELS) as LeaderboardWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
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

        {loading && !data && <div className="text-xs text-text-muted">Loading traders…</div>}
        {error && (
          <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
            Couldn&apos;t reach Polymarket: {error}
          </div>
        )}

        <ol className="flex flex-col gap-2">
          {data?.leaders.map((trader, i) => (
            <TraderRow
              key={trader.address}
              rank={i + 1}
              trader={trader}
              expanded={expanded === trader.address}
              onToggle={() =>
                setExpanded(expanded === trader.address ? null : trader.address)
              }
            />
          ))}
        </ol>
      </div>

      <CopiedPortfolio />
    </div>
  );
}

function TraderRow({
  rank,
  trader,
  expanded,
  onToggle,
}: {
  rank: number;
  trader: PolymarketTrader;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="rounded-xl border border-border-hairline bg-surface-1 shadow-[var(--shadow-card)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">{rank}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-primary">
            {traderDisplayName(trader)}
          </span>
          <span className="block text-[11px] text-text-muted">
            Vol {formatUsd(trader.volume, { compact: true })}
          </span>
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            trader.pnl >= 0 ? "text-status-good" : "text-status-critical"
          }`}
        >
          {trader.pnl >= 0 ? "+" : ""}
          {formatUsd(trader.pnl, { compact: true })}
        </span>
        <span className="text-text-muted">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && <TraderPositions trader={trader} />}
    </li>
  );
}

interface PositionsResponse {
  positions: PolymarketPosition[];
  demo: boolean;
}

function TraderPositions({ trader }: { trader: PolymarketTrader }) {
  const { data, loading, error } = usePolledFetch<PositionsResponse>(
    `/api/polymarket/positions?user=${encodeURIComponent(trader.address)}`,
    20_000
  );
  const copyPositions = useCopyTradingStore((s) => s.copyPositions);
  const toggleFollow = useCopyTradingStore((s) => s.toggleFollow);
  const following = useCopyTradingStore((s) => s.followed.includes(trader.address));
  const [flash, setFlash] = useState<string | null>(null);

  const positions = data?.positions ?? [];

  function handleCopy() {
    const result = copyPositions(
      { address: trader.address, name: trader.name },
      positions,
      COPY_BUDGET
    );
    setFlash(
      result.ok
        ? `Copied ${result.copied} position${result.copied === 1 ? "" : "s"}${
            result.skipped ? ` (${result.skipped} already held)` : ""
          }`
        : result.error ?? "Copy failed"
    );
    setTimeout(() => setFlash(null), 3000);
  }

  return (
    <div className="border-t border-border-hairline px-3 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <a
          href={polymarketProfileUrl(trader.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-text-muted underline decoration-dotted hover:text-text-secondary"
        >
          {trader.address}
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={positions.length === 0}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-[0_2px_10px_rgba(77,141,255,0.3)] transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--brand-gradient)" }}
          >
            Copy positions (${COPY_BUDGET})
          </button>
          <button
            onClick={() => toggleFollow(trader.address)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              following
                ? "border-status-good/40 bg-status-good/15 text-status-good"
                : "border-border-hairline text-text-secondary hover:bg-surface-2"
            }`}
          >
            {following ? "Auto-copying ✓" : "Auto-copy"}
          </button>
        </div>
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading positions…</div>}
      {error && <div className="text-xs text-status-critical">Couldn&apos;t load positions</div>}
      {flash && <div className="mb-1 text-[11px] text-status-good">{flash}</div>}

      <ul className="flex flex-col gap-1">
        {positions.map((p) => (
          <li
            key={`${p.marketId}:${p.outcome}`}
            className="flex items-center justify-between gap-3 rounded-md bg-surface-0 px-2 py-1.5 text-xs"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-text-primary">{p.question}</span>
              <span className="text-[11px] text-text-muted">
                {p.shares.toLocaleString()} × {p.outcome} @ {formatCents(p.avgPrice)}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-text-secondary">
              {formatCents(p.currentPrice)}
            </span>
          </li>
        ))}
        {!loading && positions.length === 0 && (
          <li className="text-xs text-text-muted">No open positions</li>
        )}
      </ul>
    </div>
  );
}

function CopiedPortfolio() {
  const { startingBalance, balance, positions, followed, removePosition, reset } =
    useCopyTradingStore();

  const positionsValue = positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalValue = balance + positionsValue;
  const totalPnl = totalValue - startingBalance;

  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-border-hairline bg-surface-1 p-3 shadow-[var(--shadow-card)] lg:h-fit">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">My Copied Portfolio</h3>
        <button
          onClick={() => {
            if (confirm("Reset copied portfolio and unfollow everyone?")) reset();
          }}
          className="text-[11px] text-text-muted hover:text-text-secondary"
        >
          Reset
        </button>
      </div>

      <div className="rounded-lg border border-border-hairline bg-surface-0 p-3">
        <div className="text-[11px] uppercase tracking-wide text-text-muted">
          Portfolio Value (virtual)
        </div>
        <div className="text-2xl font-semibold tabular-nums text-text-primary">
          {formatUsd(totalValue)}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <DeltaBadge value={(totalPnl / startingBalance) * 100} />
          <span className="text-text-muted">
            {formatUsd(totalPnl)} · cash {formatUsd(balance)}
          </span>
        </div>
        {followed.length > 0 && (
          <div className="mt-1.5 text-[11px] text-status-good">
            Auto-copying {followed.length} trader{followed.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {positions.length === 0 ? (
          <div className="text-xs text-text-muted">
            No copied positions yet. Expand a trader and hit “Copy positions”.
          </div>
        ) : (
          positions.map((p) => {
            const value = p.shares * p.currentPrice;
            const pnl = value - p.cost;
            return (
              <div
                key={p.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-text-primary">{p.question}</div>
                  <div className="text-[11px] text-text-muted">
                    {p.outcome} · {p.shares.toFixed(0)} sh @ {formatCents(p.entryPrice)} ·{" "}
                    {p.traderName ?? "copied"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`tabular-nums ${
                      pnl >= 0 ? "text-status-good" : "text-status-critical"
                    }`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {formatUsd(pnl)}
                  </span>
                  <button
                    onClick={() => removePosition(p.id)}
                    className="text-[10px] text-text-muted hover:text-status-critical"
                  >
                    close
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
