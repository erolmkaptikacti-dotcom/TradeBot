"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import { CHART_RANGE_CONFIG, type ChartRange, type StockDetail } from "@/lib/stocks";
import { formatUsd } from "@/lib/format";
import { DeltaBadge } from "./DeltaBadge";

interface ChartResponse {
  detail: StockDetail;
  range: ChartRange;
  updatedAt: number;
}

const RANGES = Object.keys(CHART_RANGE_CONFIG) as ChartRange[];
const POLL_INTERVAL_MS = 15_000;

export function StockDetailModal({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  const [range, setRange] = useState<ChartRange>("1D");
  const { data, error, loading } = usePolledFetch<ChartResponse>(
    `/api/stocks/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
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

  const points = detail?.points ?? [];
  const trendUp = points.length >= 2 ? points[points.length - 1].close >= points[0].close : true;
  const lineColor = trendUp ? "var(--status-good)" : "var(--status-critical)";
  const values = points.map((p) => p.close);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const pad = (max - min) * 0.08 || max * 0.01;

  function formatTick(time: number): string {
    const d = new Date(time);
    if (range === "1D") {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (range === "5D" || range === "1M") {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

  function formatTooltipLabel(time: number): string {
    const d = new Date(time);
    return range === "1D"
      ? d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${detail?.label ?? symbol} chart`}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border border-border-hairline bg-surface-1 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
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

        <div className="flex rounded-lg border border-border-hairline bg-surface-0 p-0.5 text-xs self-start">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                range === r
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
            Couldn&apos;t load chart: {error}
          </div>
        )}

        <div className="h-64 w-full">
          {loading && !detail ? (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              Loading chart…
            </div>
          ) : points.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--gridline)" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={formatTick}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--gridline)" }}
                  tickLine={false}
                  minTickGap={48}
                />
                <YAxis
                  domain={[min - pad, max + pad]}
                  tickFormatter={(v: number) => formatUsd(v, { compact: true })}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  orientation="right"
                />
                <Tooltip
                  labelFormatter={(time) => formatTooltipLabel(Number(time))}
                  formatter={(value) => [formatUsd(Number(value)), "Price"]}
                  cursor={{ stroke: "var(--text-muted)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#detailFill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              No chart data for this range
            </div>
          )}
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
