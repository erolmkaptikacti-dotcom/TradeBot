"use client";

import { useCallback, useEffect } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { tradingViewSymbol, type StockDetail } from "@/lib/stocks";
import { formatUsd } from "@/lib/format";
import { DeltaBadge } from "./DeltaBadge";
import { TradingViewChart } from "./TradingViewChart";

interface ChartResponse {
  detail: StockDetail;
  updatedAt: number;
}

const POLL_INTERVAL_MS = 15_000;

export function StockDetailModal({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  // Stats come from our Yahoo proxy; the chart itself is TradingView's
  // widget, which updates independently — so even if the stats fetch fails,
  // the chart still renders.
  const { data } = usePolledFetch<ChartResponse>(
    `/api/stocks/chart?symbol=${encodeURIComponent(symbol)}`,
    POLL_INTERVAL_MS
  );
  const detail = data?.detail;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${detail?.label ?? symbol} chart`}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-2xl border border-border-hairline bg-surface-1 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                {detail?.label ?? symbol}
              </h2>
              <span className="text-xs text-text-muted">{symbol}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-text-primary">
                {detail ? formatUsd(detail.price) : "—"}
              </span>
              {detail && <DeltaBadge value={detail.changePercent} />}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-border-hairline px-2.5 py-1 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="h-[440px] w-full overflow-hidden rounded-xl border border-border-hairline">
          <TradingViewChart symbol={tradingViewSymbol(symbol)} />
        </div>

        {detail && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
