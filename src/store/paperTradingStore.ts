import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderSide = "buy" | "sell";

export interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  total: number;
  realizedPnl: number | null;
  timestamp: number;
}

export interface OrderResult {
  ok: boolean;
  error?: string;
}

interface PaperTradingState {
  startingBalance: number;
  balance: number;
  positions: Record<string, Position>;
  trades: Trade[];
  /**
   * Executes a simulated market order at the given (live) price.
   * This is the single seam where "mimic trading" plugs in: swapping this
   * body for a real broker/exchange order call is the whole diff needed to
   * go from paper trading to a live automated bot, since callers (manual
   * UI or a future strategy loop) never touch balances/positions directly.
   */
  placeOrder: (order: {
    symbol: string;
    side: OrderSide;
    quantity: number;
    price: number;
  }) => OrderResult;
  reset: () => void;
}

const STARTING_BALANCE = 10_000;

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      startingBalance: STARTING_BALANCE,
      balance: STARTING_BALANCE,
      positions: {},
      trades: [],

      placeOrder: ({ symbol, side, quantity, price }) => {
        if (quantity <= 0 || price <= 0) {
          return { ok: false, error: "Quantity and price must be positive" };
        }

        const { balance, positions } = get();
        const existing = positions[symbol];
        const total = quantity * price;

        if (side === "buy") {
          if (total > balance) {
            return { ok: false, error: "Insufficient virtual balance" };
          }
          const newQuantity = (existing?.quantity ?? 0) + quantity;
          const newAvgEntry = existing
            ? (existing.avgEntryPrice * existing.quantity + total) / newQuantity
            : price;

          const trade: Trade = {
            id: crypto.randomUUID(),
            symbol,
            side,
            quantity,
            price,
            total,
            realizedPnl: null,
            timestamp: Date.now(),
          };

          set({
            balance: balance - total,
            positions: {
              ...positions,
              [symbol]: { symbol, quantity: newQuantity, avgEntryPrice: newAvgEntry },
            },
            trades: [trade, ...get().trades],
          });
          return { ok: true };
        }

        // sell
        if (!existing || existing.quantity < quantity) {
          return { ok: false, error: "Not enough position to sell" };
        }
        const realizedPnl = (price - existing.avgEntryPrice) * quantity;
        const remainingQuantity = existing.quantity - quantity;
        const newPositions = { ...positions };
        if (remainingQuantity <= 1e-9) {
          delete newPositions[symbol];
        } else {
          newPositions[symbol] = {
            symbol,
            quantity: remainingQuantity,
            avgEntryPrice: existing.avgEntryPrice,
          };
        }

        const trade: Trade = {
          id: crypto.randomUUID(),
          symbol,
          side,
          quantity,
          price,
          total,
          realizedPnl,
          timestamp: Date.now(),
        };

        set({
          balance: balance + total,
          positions: newPositions,
          trades: [trade, ...get().trades],
        });
        return { ok: true };
      },

      reset: () =>
        set({ balance: STARTING_BALANCE, positions: {}, trades: [] }),
    }),
    { name: "tradebot-paper-trading" }
  )
);
