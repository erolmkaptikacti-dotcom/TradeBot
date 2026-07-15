"use client";

import { useEffect, useRef } from "react";
import { useCopyTradingStore } from "@/store/copyTradingStore";
import type { PolymarketPosition } from "@/lib/polymarket";

const SYNC_INTERVAL_MS = 20_000;
const PER_FOLLOW_BUDGET = 100; // virtual USDC allocated per sync, per followed trader

interface PositionsResponse {
  positions: PolymarketPosition[];
  demo: boolean;
}

/**
 * Background engine: for each followed trader, periodically fetches their
 * current Polymarket positions and mirrors any *new* ones into the paper
 * wallet (copyPositions is idempotent, so already-copied positions are
 * skipped). It also refreshes current prices on existing copied positions
 * so PnL tracks live. Runs mounted once at the app root (CopyMirrorRunner)
 * so following keeps working across tabs — but only while the browser tab
 * is open, since there's no server-side scheduler behind it.
 */
export function useCopyMirrorEngine() {
  const followed = useCopyTradingStore((s) => s.followed);
  const copyPositions = useCopyTradingStore((s) => s.copyPositions);
  const updatePrices = useCopyTradingStore((s) => s.updatePrices);

  const ref = useRef({ followed, copyPositions, updatePrices });
  useEffect(() => {
    ref.current = { followed, copyPositions, updatePrices };
  });

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const { followed, copyPositions, updatePrices } = ref.current;
      if (followed.length === 0) return;

      const priceUpdates: Record<string, number> = {};

      for (const trader of followed) {
        try {
          const demoParam = trader.demo ? "&demo=1" : "";
          const res = await fetch(
            `/api/polymarket/positions?user=${encodeURIComponent(trader.address)}${demoParam}`
          );
          if (!res.ok) continue;
          const body: PositionsResponse = await res.json();
          if (cancelled) return;

          copyPositions(
            { address: trader.address, name: trader.name },
            body.positions,
            PER_FOLLOW_BUDGET
          );
          for (const p of body.positions) {
            priceUpdates[`${trader.address}:${p.marketId}:${p.outcome}`] = p.currentPrice;
          }
        } catch {
          // skip this trader on error; try again next interval
        }
      }

      if (!cancelled && Object.keys(priceUpdates).length > 0) {
        updatePrices(priceUpdates);
      }
    }

    sync();
    const id = setInterval(sync, SYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
}
