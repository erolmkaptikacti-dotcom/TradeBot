"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { formatUsd } from "@/lib/format";
import type { StockQuote } from "@/lib/stocks";
import { DeltaBadge } from "./DeltaBadge";
import { PriceSparkline } from "./PriceSparkline";
import { StockDetailModal } from "./StockDetailModal";

interface WatchlistResponse {
  quotes: StockQuote[];
  updatedAt: number;
}

const POLL_INTERVAL_MS = 15_000;

export function StocksPanel() {
  const { data, error, loading } = usePolledFetch<WatchlistResponse>(
    "/api/stocks/watchlist",
    POLL_INTERVAL_MS
  );
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Markets</h2>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Stocks, indices, commodities, and crypto via Yahoo Finance, polled every{" "}
            {POLL_INTERVAL_MS / 1000}s. Click any card for a detailed chart. Stock and
            index prices only move while US markets are open.
          </p>
        </div>
        {data && <MarketStateBadge quotes={data.quotes} />}
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading live data…</div>}

      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Yahoo Finance: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {data?.quotes.map((quote) => (
          <button
            key={quote.symbol}
            onClick={() => setSelectedSymbol(quote.symbol)}
            className="flex flex-col gap-2 rounded-xl border border-border-hairline bg-surface-1 p-3 text-left transition-all hover:border-[var(--accent)] hover:bg-surface-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">{quote.label}</div>
                <div className="text-xs text-text-muted">{quote.symbol}</div>
              </div>
              <DeltaBadge value={quote.changePercent} />
            </div>

            <div className="text-lg font-semibold tabular-nums text-text-primary">
              {formatUsd(quote.price)}
            </div>

            <PriceSparkline data={quote.closes} />

            <div className="flex justify-between text-[11px] text-text-muted">
              <span>H {formatUsd(quote.high)}</span>
              <span>L {formatUsd(quote.low)}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedSymbol && (
        <StockDetailModal symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      )}
    </div>
  );
}

function MarketStateBadge({ quotes }: { quotes: StockQuote[] }) {
  const isOpen = quotes.some((q) => q.marketState === "REGULAR");
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-text-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-status-good" : "bg-status-warning"}`}
        aria-hidden
      />
      {isOpen ? "Market open" : "Market closed"}
    </div>
  );
}
