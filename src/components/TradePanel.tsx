"use client";

import { useMemo, useState } from "react";
import { useBinanceTicker } from "@/hooks/useBinanceTicker";
import { coinLabel } from "@/lib/binance";
import { formatUsd } from "@/lib/format";
import { usePaperTradingStore, type OrderSide } from "@/store/paperTradingStore";
import { DeltaBadge } from "./DeltaBadge";

export function TradePanel({ selectedSymbol }: { selectedSymbol: string }) {
  const { balance, startingBalance, positions, trades, placeOrder, reset } =
    usePaperTradingStore();
  const [side, setSide] = useState<OrderSide>("buy");
  const [quantity, setQuantity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const trackedSymbols = useMemo(
    () => Array.from(new Set([selectedSymbol, ...Object.keys(positions)])),
    [selectedSymbol, positions]
  );
  const { ticks } = useBinanceTicker(trackedSymbols);
  const livePrice = ticks[selectedSymbol]?.price;

  const positionList = Object.values(positions);
  const portfolioValue =
    balance +
    positionList.reduce((sum, p) => {
      const price = ticks[p.symbol]?.price ?? p.avgEntryPrice;
      return sum + p.quantity * price;
    }, 0);
  const totalPnl = portfolioValue - startingBalance;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const qty = Number(quantity);
    if (!livePrice) {
      setFormError("Waiting for a live price…");
      return;
    }
    if (!qty || qty <= 0) {
      setFormError("Enter a quantity greater than 0");
      return;
    }
    const result = placeOrder({ symbol: selectedSymbol, side, quantity: qty, price: livePrice });
    if (!result.ok) {
      setFormError(result.error ?? "Order failed");
      return;
    }
    setQuantity("");
  }

  return (
    <section className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Mimic Trading</h2>
        <button
          onClick={() => {
            if (confirm("Reset paper trading balance and history?")) reset();
          }}
          className="text-[11px] text-text-muted hover:text-text-secondary"
        >
          Reset
        </button>
      </div>

      <div className="rounded-lg border border-border-hairline bg-surface-1 p-3">
        <div className="text-[11px] text-text-muted">Portfolio Value (virtual)</div>
        <div className="text-2xl font-semibold tabular-nums text-text-primary">
          {formatUsd(portfolioValue)}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <DeltaBadge value={(totalPnl / startingBalance) * 100} />
          <span className="text-text-muted">
            {formatUsd(totalPnl)} since start · cash {formatUsd(balance)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface-1 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">{coinLabel(selectedSymbol)}</span>
          <span className="tabular-nums text-text-secondary">
            {livePrice ? formatUsd(livePrice) : "—"}
          </span>
        </div>

        <div className="flex rounded-md border border-border-hairline p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`flex-1 rounded py-1.5 transition-colors ${
              side === "buy" ? "bg-status-good/20 text-status-good" : "text-text-muted"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`flex-1 rounded py-1.5 transition-colors ${
              side === "sell" ? "bg-status-critical/20 text-status-critical" : "text-text-muted"
            }`}
          >
            Sell
          </button>
        </div>

        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Quantity
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>

        {quantity && livePrice && (
          <div className="text-[11px] text-text-muted">
            ≈ {formatUsd(Number(quantity) * livePrice)}
          </div>
        )}

        {formError && <div className="text-[11px] text-status-critical">{formError}</div>}

        <button
          type="submit"
          className={`rounded-md py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
            side === "buy" ? "bg-status-good" : "bg-status-critical"
          }`}
        >
          {side === "buy" ? "Buy" : "Sell"} {coinLabel(selectedSymbol)}
        </button>
      </form>

      <div className="flex flex-col gap-2 overflow-hidden">
        <h3 className="text-xs font-semibold text-text-muted">Positions</h3>
        {positionList.length === 0 ? (
          <div className="text-xs text-text-muted">No open positions</div>
        ) : (
          <ul className="flex flex-col gap-1.5 overflow-y-auto">
            {positionList.map((p) => {
              const price = ticks[p.symbol]?.price;
              const unrealized = price ? (price - p.avgEntryPrice) * p.quantity : null;
              return (
                <li
                  key={p.symbol}
                  className="flex items-center justify-between rounded-md border border-border-hairline bg-surface-1 px-2 py-1.5 text-xs"
                >
                  <div>
                    <div className="font-medium text-text-primary">{coinLabel(p.symbol)}</div>
                    <div className="text-text-muted">
                      {p.quantity} @ {formatUsd(p.avgEntryPrice)}
                    </div>
                  </div>
                  {unrealized !== null && <DeltaBadge value={unrealized} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <h3 className="text-xs font-semibold text-text-muted">Trade History</h3>
        {trades.length === 0 ? (
          <div className="text-xs text-text-muted">No trades yet</div>
        ) : (
          <ul className="flex flex-col gap-1 overflow-y-auto pr-1">
            {trades.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md px-2 py-1 text-[11px] text-text-secondary"
              >
                <span className={t.side === "buy" ? "text-status-good" : "text-status-critical"}>
                  {t.side.toUpperCase()} {coinLabel(t.symbol)}
                </span>
                <span className="tabular-nums">
                  {t.quantity} @ {formatUsd(t.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
