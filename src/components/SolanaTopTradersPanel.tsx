"use client";

import { useState } from "react";
import { usePolledFetch } from "@/hooks/usePolledFetch";
import {
  shortenAddress,
  solscanUrl,
  TIME_FRAME_LABELS,
  type BirdeyeTrader,
  type TraderTimeFrame,
  type TraderType,
} from "@/lib/birdeye";
import { formatSignedUsd, formatUsd } from "@/lib/format";

interface TopTradersResponse {
  traders: BirdeyeTrader[];
  type: TraderType;
  timeFrame: TraderTimeFrame;
  demo: boolean;
  updatedAt: number;
}

const POLL_INTERVAL_MS = 20_000;

export function SolanaTopTradersPanel() {
  const [type, setType] = useState<TraderType>("gainers");
  const [timeFrame, setTimeFrame] = useState<TraderTimeFrame>("today");

  const { data, error, loading } = usePolledFetch<TopTradersResponse>(
    `/api/birdeye/top-traders?type=${type}&timeFrame=${timeFrame}`,
    POLL_INTERVAL_MS
  );

  const traders = data?.traders ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface-1 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Solana Top Traders
            </h3>
            {data?.demo && (
              <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-status-warning">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-text-muted">
            {data?.demo
              ? "Simulated wallets and PnL — not real traders. Add a Birdeye API key to switch this to live data."
              : "Real wallet addresses ranked by realized PnL, via Birdeye — actual traders, not just top-moving coins."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: "gainers", label: "Gainers" },
              { value: "losers", label: "Losers" },
            ]}
          />
          <SegmentedControl
            value={timeFrame}
            onChange={setTimeFrame}
            options={Object.entries(TIME_FRAME_LABELS).map(([value, label]) => ({
              value: value as TraderTimeFrame,
              label,
            }))}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-status-critical/30 bg-status-critical/10 p-2 text-xs text-status-critical">
          Couldn&apos;t reach Birdeye: {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-xs text-text-muted">Loading live data…</div>
      )}

      {data && (
        <ol className="flex flex-col gap-1">
          {traders.map((trader, i) => {
            const rowClasses = "flex items-center gap-3 rounded-md px-2 py-2 text-left";
            const rowContent = (
              <>
                <span className="w-5 shrink-0 text-xs tabular-nums text-text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm text-text-primary">
                    {shortenAddress(trader.address)}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    Vol {formatUsd(trader.volume, { compact: true })} · {trader.tradeCount}{" "}
                    trades
                  </span>
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    trader.pnl > 0
                      ? "text-status-good"
                      : trader.pnl < 0
                      ? "text-status-critical"
                      : "text-text-muted"
                  }`}
                >
                  {formatSignedUsd(trader.pnl, { compact: true })}
                </span>
              </>
            );
            return (
              <li key={trader.address}>
                {data.demo ? (
                  <div className={rowClasses}>{rowContent}</div>
                ) : (
                  <a
                    href={solscanUrl(trader.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${rowClasses} hover:bg-surface-2`}
                  >
                    {rowContent}
                  </a>
                )}
              </li>
            );
          })}
          {traders.length === 0 && (
            <li className="px-2 py-2 text-xs text-text-muted">No data</li>
          )}
        </ol>
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border border-border-hairline bg-surface-0 p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`whitespace-nowrap rounded px-2 py-1 transition-colors ${
            value === opt.value
              ? "bg-surface-2 text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
