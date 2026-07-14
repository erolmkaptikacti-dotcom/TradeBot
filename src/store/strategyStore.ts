import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TriggerType = "drop_percent" | "rise_percent" | "price_below" | "price_above";

export interface Strategy {
  id: string;
  symbol: string;
  action: "buy" | "sell";
  triggerType: TriggerType;
  triggerValue: number; // percent (e.g. 5 for 5%) or an absolute USD price
  referencePrice: number; // live price captured when the strategy was created
  quantity: number;
  status: "active" | "triggered";
  resultMessage: string | null;
  createdAt: number;
  triggeredAt: number | null;
}

export type NewStrategyInput = Pick<
  Strategy,
  "symbol" | "action" | "triggerType" | "triggerValue" | "referencePrice" | "quantity"
>;

interface StrategyState {
  strategies: Strategy[];
  addStrategy: (input: NewStrategyInput) => void;
  removeStrategy: (id: string) => void;
  markTriggered: (id: string, resultMessage: string) => void;
}

/**
 * Evaluates whether a strategy's condition is met at the given live price.
 * Pulled out as a standalone function (rather than inlined in the engine
 * hook) so it's easy to unit test and to extend with new trigger types.
 */
export function checkTrigger(strategy: Strategy, price: number): boolean {
  switch (strategy.triggerType) {
    case "drop_percent":
      return price <= strategy.referencePrice * (1 - strategy.triggerValue / 100);
    case "rise_percent":
      return price >= strategy.referencePrice * (1 + strategy.triggerValue / 100);
    case "price_below":
      return price <= strategy.triggerValue;
    case "price_above":
      return price >= strategy.triggerValue;
  }
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set) => ({
      strategies: [],

      addStrategy: (input) =>
        set((state) => ({
          strategies: [
            {
              ...input,
              id: crypto.randomUUID(),
              status: "active",
              resultMessage: null,
              createdAt: Date.now(),
              triggeredAt: null,
            },
            ...state.strategies,
          ],
        })),

      removeStrategy: (id) =>
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== id),
        })),

      markTriggered: (id, resultMessage) =>
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === id
              ? { ...s, status: "triggered", resultMessage, triggeredAt: Date.now() }
              : s
          ),
        })),
    }),
    { name: "tradebot-strategies" }
  )
);
