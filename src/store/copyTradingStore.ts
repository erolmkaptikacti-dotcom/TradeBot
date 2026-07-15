import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PolymarketPosition } from "@/lib/polymarket";

// A separate paper wallet for prediction-market copy-trading, kept apart
// from the crypto paper-trading store because the semantics differ: here a
// "position" is outcome shares priced 0..1 that settle to $1 or $0. This is
// simulated end-to-end — no real Polymarket wallet, no real money — but it
// mirrors the *real* positions that real profitable traders are holding.

export interface CopiedPosition {
  id: string; // `${traderAddress}:${marketId}:${outcome}` — dedupes re-copies
  traderAddress: string;
  traderName: string | null;
  marketId: string;
  question: string;
  outcome: string;
  shares: number;
  entryPrice: number; // 0..1, price paid when copied
  currentPrice: number; // 0..1, latest known
  cost: number; // shares * entryPrice, deducted from balance
  copiedAt: number;
}

export interface CopyResult {
  ok: boolean;
  copied: number;
  skipped: number;
  error?: string;
}

interface CopyTradingState {
  startingBalance: number;
  balance: number;
  positions: CopiedPosition[];
  followed: string[]; // trader addresses being auto-mirrored
  /**
   * Mirrors a trader's positions into the paper wallet, allocating `budget`
   * across them proportionally to the trader's own exposure. Positions
   * already copied (same trader+market+outcome) are skipped so repeated
   * calls (including from the auto-mirror engine) are idempotent. This is
   * the copy-trading analogue of paperTradingStore.placeOrder — the single
   * seam where a real Polymarket order would later plug in.
   */
  copyPositions: (
    trader: { address: string; name: string | null },
    positions: PolymarketPosition[],
    budget: number
  ) => CopyResult;
  updatePrices: (prices: Record<string, number>) => void; // keyed by position id
  toggleFollow: (address: string) => void;
  isFollowing: (address: string) => boolean;
  removePosition: (id: string) => void;
  reset: () => void;
}

const STARTING_BALANCE = 1_000;

function positionId(traderAddress: string, marketId: string, outcome: string): string {
  return `${traderAddress}:${marketId}:${outcome}`;
}

export const useCopyTradingStore = create<CopyTradingState>()(
  persist(
    (set, get) => ({
      startingBalance: STARTING_BALANCE,
      balance: STARTING_BALANCE,
      positions: [],
      followed: [],

      copyPositions: (trader, positions, budget) => {
        const state = get();
        const existingIds = new Set(state.positions.map((p) => p.id));

        const fresh = positions.filter(
          (p) => !existingIds.has(positionId(trader.address, p.marketId, p.outcome))
        );
        if (fresh.length === 0) return { ok: true, copied: 0, skipped: positions.length };

        const spendable = Math.min(budget, state.balance);
        if (spendable <= 0) {
          return { ok: false, copied: 0, skipped: positions.length, error: "Insufficient balance" };
        }

        // Weight allocation by each fresh position's value in the trader's book.
        const totalValue = fresh.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
        const additions: CopiedPosition[] = [];
        let spent = 0;

        for (const p of fresh) {
          const weight = totalValue > 0 ? (p.shares * p.currentPrice) / totalValue : 1 / fresh.length;
          const allocation = spendable * weight;
          if (p.currentPrice <= 0) continue;
          const shares = allocation / p.currentPrice;
          if (shares <= 0) continue;
          const cost = shares * p.currentPrice;
          spent += cost;
          additions.push({
            id: positionId(trader.address, p.marketId, p.outcome),
            traderAddress: trader.address,
            traderName: trader.name,
            marketId: p.marketId,
            question: p.question,
            outcome: p.outcome,
            shares,
            entryPrice: p.currentPrice,
            currentPrice: p.currentPrice,
            cost,
            copiedAt: Date.now(),
          });
        }

        if (additions.length === 0) {
          return { ok: false, copied: 0, skipped: positions.length, error: "Nothing to copy" };
        }

        set({
          balance: state.balance - spent,
          positions: [...additions, ...state.positions],
        });
        return {
          ok: true,
          copied: additions.length,
          skipped: positions.length - additions.length,
        };
      },

      updatePrices: (prices) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            prices[p.id] !== undefined ? { ...p, currentPrice: prices[p.id] } : p
          ),
        })),

      toggleFollow: (address) =>
        set((state) => ({
          followed: state.followed.includes(address)
            ? state.followed.filter((a) => a !== address)
            : [...state.followed, address],
        })),

      isFollowing: (address) => get().followed.includes(address),

      removePosition: (id) =>
        set((state) => {
          const pos = state.positions.find((p) => p.id === id);
          if (!pos) return state;
          // Return current market value to the balance (closing the position).
          const value = pos.shares * pos.currentPrice;
          return {
            balance: state.balance + value,
            positions: state.positions.filter((p) => p.id !== id),
          };
        }),

      reset: () =>
        set({ balance: STARTING_BALANCE, positions: [], followed: [] }),
    }),
    { name: "tradebot-copy-trading" }
  )
);
