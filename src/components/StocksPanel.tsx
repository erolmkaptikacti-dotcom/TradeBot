"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { formatUsd } from "@/lib/format";
import {
  STOCK_WATCHLIST,
  stockLabel,
  tradingViewSymbol,
  type StockDetail,
  type StockQuote,
} from "@/lib/stocks";
import { DeltaBadge } from "./DeltaBadge";
import { PriceSparkline } from "./PriceSparkline";
import { TradingViewChart } from "./TradingViewChart";

interface WatchlistResponse {
  quotes: StockQuote[];
  updatedAt: number;
}

interface ChartResponse {
  detail: StockDetail;
  updatedAt: number;
}

const POLL_INTERVAL_MS = 15_000;

export function StocksPanel() {
  // The symbol chips and the TradingView chart are fully static/client-side
  // (no Yahoo dependency), so the main chart always renders even if the
  // quote feed is down — only the stats strip and watchlist grid need Yahoo.
  const [selectedSymbol, setSelectedSymbol] = useState<string>(STOCK_WATCHLIST[7]); // ^IXIC

  const { data, error, loading } = usePolledFetch<WatchlistResponse>(
    "/api/stocks/watchlist",
    POLL_INTERVAL_MS
  );
  const { data: chartData } = usePolledFetch<ChartResponse>(
    `/api/stocks/chart?symbol=${encodeURIComponent(selectedSymbol)}`,
    POLL_INTERVAL_MS
  );
  const detail = chartData?.detail;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap gap-1.5">
        {STOCK_WATCHLIST.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setSelectedSymbol(symbol)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              symbol === selectedSymbol
                ? "border-[var(--accent)] bg-surface-3 text-text-primary"
                : "border-border-hairline bg-surface-1 text-text-muted hover:bg-surface-2 hover:text-text-secondary"
            }`}
          >
            {stockLabel(symbol)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-hairline bg-surface-1 p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              {stockLabel(selectedSymbol)}
            </h2>
            <span className="text-xs text-text-muted">{selectedSymbol}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums text-text-primary">
              {detail ? formatUsd(detail.price) : ""}
            </span>
            {detail && <DeltaBadge value={detail.changePercent} />}
          </div>
        </div>

        <div className="h-[460px] w-full overflow-hidden rounded-xl border border-border-hairline">
          <TradingViewChart symbol={tradingViewSymbol(selectedSymbol)} />
        </div>

        {detail && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Previous close" value={formatUsd(detail.previousClose)} />
            <StatTile label="Day high" value={formatUsd(detail.dayHigh)} />
            <StatTile label="Day low" value={formatUsd(detail.dayLow)} />
            <StatTile
              label="52-week high"
              value={detail.fiftyTwoWeekHigh !== null ? formatUsd(detail.fiftyTwoWeekHigh) : "—"}
            />
            <StatTile
              label="52-week low"
              value={detail.fiftyTwoWeekLow !== null ? formatUsd(detail.fiftyTwoWeekLow) : "—"}
            />
            <StatTile
              label="Volume"
              value={
                detail.volume !== null && detail.volume > 0
                  ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(detail.volume)
                  : "—"
              }
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Watchlist</h3>
        {data && <MarketStateBadge quotes={data.quotes} />}
      </div>

      {loading && !data && <div className="text-xs text-text-muted">Loading live quotes…</div>}

      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Yahoo Finance for live quotes: {error}. The chart above still
          works — it streams directly from TradingView.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.quotes.map((quote) => (
          <button
            key={quote.symbol}
            onClick={() => setSelectedSymbol(quote.symbol)}
            className={`flex flex-col gap-2 rounded-xl border p-3 text-left shadow-[var(--shadow-card)] transition-all ${
              quote.symbol === selectedSymbol
                ? "border-[var(--accent)] bg-surface-2"
                : "border-border-hairline bg-surface-1 hover:border-[var(--accent)]/50 hover:bg-surface-2"
            }`}
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
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-hairline bg-surface-0 px-3 py-2">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-medium tabular-nums text-text-primary">{value}</div>
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
