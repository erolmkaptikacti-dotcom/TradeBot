"use client";

import { useEffect, useMemo, useRef } from "react";
import { useBinanceTicker } from "./useBinanceTicker";
import { checkTrigger, useStrategyStore } from "@/store/strategyStore";
import { usePaperTradingStore } from "@/store/paperTradingStore";

const CHECK_INTERVAL_MS = 3000;

/**
 * Background engine: on an interval, checks every active strategy's
 * condition against the latest live price and fires a paper trade when
 * triggered. Runs mounted once at the app root (see
 * StrategyEngineRunner) so strategies keep evaluating across tab
 * navigation — though only while this browser tab stays open, since
 * there's no server-side scheduler behind it yet.
 */
export function useStrategyEngine() {
  const strategies = useStrategyStore((s) => s.strategies);
  const markTriggered = useStrategyStore((s) => s.markTriggered);
  const placeOrder = usePaperTradingStore((s) => s.placeOrder);

  const activeSymbols = useMemo(() => {
    const symbols = strategies.filter((s) => s.status === "active").map((s) => s.symbol);
    return Array.from(new Set(symbols));
  }, [strategies]);

  const { ticks } = useBinanceTicker(activeSymbols);

  // Kept in sync after every render (not during render, and not via
  // setState) so the interval callback below always sees the latest
  // values without needing to re-subscribe.
  const stateRef = useRef({ strategies, ticks, markTriggered, placeOrder });
  useEffect(() => {
    stateRef.current = { strategies, ticks, markTriggered, placeOrder };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const { strategies, ticks, markTriggered, placeOrder } = stateRef.current;
      for (const strategy of strategies) {
        if (strategy.status !== "active") continue;
        const tick = ticks[strategy.symbol];
        if (!tick) continue;
        if (!checkTrigger(strategy, tick.price)) continue;

        const result = placeOrder({
          symbol: strategy.symbol,
          side: strategy.action,
          quantity: strategy.quantity,
          price: tick.price,
        });
        markTriggered(
          strategy.id,
          result.ok
            ? `${strategy.action === "buy" ? "Bought" : "Sold"} ${strategy.quantity} @ $${tick.price.toFixed(2)}`
            : `Failed: ${result.error}`
        );
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
