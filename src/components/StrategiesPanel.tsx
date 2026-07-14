"use client";

import { useState } from "react";
import { useBinanceTicker } from "@/hooks/useBinanceTicker";
import { coinLabel, WATCHLIST } from "@/lib/binance";
import { formatUsd } from "@/lib/format";
import {
  useStrategyStore,
  type Strategy,
  type TriggerType,
} from "@/store/strategyStore";
import { DeltaBadge } from "./DeltaBadge";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  drop_percent: "Price drops by %",
  rise_percent: "Price rises by %",
  price_below: "Price falls to/below $",
  price_above: "Price rises to/above $",
};

function describeStrategy(s: Strategy): string {
  const verb = s.action === "buy" ? "Buy" : "Sell";
  const asset = `${s.quantity} ${coinLabel(s.symbol)}`;
  switch (s.triggerType) {
    case "drop_percent":
      return `${verb} ${asset} if price drops ${s.triggerValue}% below ${formatUsd(s.referencePrice)}`;
    case "rise_percent":
      return `${verb} ${asset} if price rises ${s.triggerValue}% above ${formatUsd(s.referencePrice)}`;
    case "price_below":
      return `${verb} ${asset} if price falls to/below ${formatUsd(s.triggerValue)}`;
    case "price_above":
      return `${verb} ${asset} if price rises to/above ${formatUsd(s.triggerValue)}`;
  }
}

export function StrategiesPanel() {
  const strategies = useStrategyStore((s) => s.strategies);
  const addStrategy = useStrategyStore((s) => s.addStrategy);
  const removeStrategy = useStrategyStore((s) => s.removeStrategy);
  const { ticks } = useBinanceTicker([...WATCHLIST]);

  const [symbol, setSymbol] = useState<string>(WATCHLIST[0]);
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [triggerType, setTriggerType] = useState<TriggerType>("drop_percent");
  const [triggerValue, setTriggerValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const active = strategies.filter((s) => s.status === "active");
  const triggered = strategies.filter((s) => s.status === "triggered");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const value = Number(triggerValue);
    const qty = Number(quantity);
    const livePrice = ticks[symbol]?.price;

    if (!livePrice) {
      setFormError("Waiting for a live price for this symbol…");
      return;
    }
    if (!value || value <= 0) {
      setFormError("Enter a trigger value greater than 0");
      return;
    }
    if (!qty || qty <= 0) {
      setFormError("Enter a quantity greater than 0");
      return;
    }

    addStrategy({
      symbol,
      action,
      triggerType,
      triggerValue: value,
      referencePrice: livePrice,
      quantity: qty,
    });
    setTriggerValue("");
    setQuantity("");
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Strategies</h2>
        <p className="mt-0.5 max-w-2xl text-[11px] leading-snug text-text-muted">
          Simple rule-based automation against the paper-trading engine: set a
          condition, and it fires a simulated buy/sell the moment live price
          crosses it. Checked every few seconds while this tab is open — there&apos;s
          no server-side scheduler yet, so it pauses if you close the browser.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-border-hairline bg-surface-1 p-3 lg:flex-row lg:flex-wrap lg:items-end"
      >
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Coin
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-[var(--series-1)]"
          >
            {WATCHLIST.map((s) => (
              <option key={s} value={s}>
                {coinLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Action
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as "buy" | "sell")}
            className="rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-[var(--series-1)]"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Condition
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
            className="rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-[var(--series-1)]"
          >
            {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Trigger value
          <input
            type="number"
            step="any"
            min="0"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            placeholder={triggerType.includes("percent") ? "5" : "60000"}
            className="w-28 rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Quantity
          <input
            type="number"
            step="any"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.01"
            className="w-28 rounded-md border border-border-hairline bg-surface-0 px-2 py-1.5 text-sm text-text-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Create Strategy
        </button>

        {formError && (
          <div className="w-full text-[11px] text-status-critical">{formError}</div>
        )}
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-text-muted">
          Active ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="text-xs text-text-muted">No active strategies</div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {active.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border-hairline bg-surface-1 px-3 py-2 text-xs"
              >
                <span className="text-text-primary">{describeStrategy(s)}</span>
                <div className="flex shrink-0 items-center gap-3">
                  {ticks[s.symbol] && <DeltaBadge value={ticks[s.symbol].changePercent} />}
                  <button
                    onClick={() => removeStrategy(s.id)}
                    className="text-text-muted hover:text-status-critical"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-text-muted">
          Triggered ({triggered.length})
        </h3>
        {triggered.length === 0 ? (
          <div className="text-xs text-text-muted">No strategies have triggered yet</div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {triggered.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border-hairline bg-surface-1 px-3 py-2 text-xs"
              >
                <div>
                  <div className="text-text-secondary">{describeStrategy(s)}</div>
                  <div
                    className={
                      s.resultMessage?.startsWith("Failed")
                        ? "text-status-critical"
                        : "text-status-good"
                    }
                  >
                    {s.resultMessage}
                  </div>
                </div>
                <button
                  onClick={() => removeStrategy(s.id)}
                  className="shrink-0 text-text-muted hover:text-status-critical"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
