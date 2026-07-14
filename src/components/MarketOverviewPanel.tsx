"use client";

import { useEffect, useState } from "react";
import { useBinanceTicker } from "@/hooks/useBinanceTicker";
import { WATCHLIST, coinLabel, formatUsd } from "@/lib/binance";
import { DeltaBadge } from "./DeltaBadge";
import { PriceSparkline } from "./PriceSparkline";

const HISTORY_LENGTH = 60;

export function MarketOverviewPanel({
  selectedSymbol,
  onSelectSymbol,
}: {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) {
  const { ticks, history: liveHistory, status } = useBinanceTicker([...WATCHLIST], {
    historyLength: HISTORY_LENGTH,
  });
  const [seedHistory, setSeedHistory] = useState<Record<string, number[]>>({});

  // Seed each sparkline with recent 1m closes on mount, once. Live ticks
  // (accumulated inside useBinanceTicker) take over from there.
  useEffect(() => {
    let cancelled = false;
    async function seed() {
      const entries = await Promise.all(
        WATCHLIST.map(async (symbol) => {
          try {
            const res = await fetch(
              `/api/binance/klines?symbol=${symbol}&interval=1m&limit=${HISTORY_LENGTH}`
            );
            const body = await res.json();
            return [symbol, (body.closes as number[]) ?? []] as const;
          } catch {
            return [symbol, []] as const;
          }
        })
      );
      if (cancelled) return;
      setSeedHistory(Object.fromEntries(entries));
    }
    seed();
    return () => {
      cancelled = true;
    };
  }, []);

  function sparklineData(symbol: string): number[] {
    const live = liveHistory[symbol] ?? [];
    if (live.length >= HISTORY_LENGTH) return live;
    const seed = seedHistory[symbol] ?? [];
    return [...seed.slice(0, HISTORY_LENGTH - live.length), ...live];
  }

  return (
    <section className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Market Overview</h2>
        <ConnectionStatus status={status} />
      </div>

      <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {WATCHLIST.map((symbol) => {
          const tick = ticks[symbol];
          const isSelected = symbol === selectedSymbol;
          return (
            <button
              key={symbol}
              onClick={() => onSelectSymbol(symbol)}
              className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-[var(--series-1)] bg-surface-2"
                  : "border-border-hairline bg-surface-1 hover:bg-surface-2"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {coinLabel(symbol)}
                  </div>
                  <div className="text-xs text-text-muted">{symbol}</div>
                </div>
                {tick && <DeltaBadge value={tick.changePercent} />}
              </div>

              <div className="text-lg font-semibold tabular-nums text-text-primary">
                {tick ? formatUsd(tick.price) : "—"}
              </div>

              <PriceSparkline data={sparklineData(symbol)} />

              {tick && (
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>H {formatUsd(tick.high)}</span>
                  <span>L {formatUsd(tick.low)}</span>
                  <span>Vol {formatUsd(tick.quoteVolume, { compact: true })}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionStatus({ status }: { status: "connecting" | "open" | "closed" }) {
  const label =
    status === "open" ? "Live" : status === "connecting" ? "Connecting…" : "Reconnecting…";
  const color =
    status === "open"
      ? "bg-status-good"
      : status === "connecting"
      ? "bg-status-warning"
      : "bg-status-critical";
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      {label}
    </div>
  );
}
