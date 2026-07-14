// Shared Binance constants, types, and formatting helpers.

export const WATCHLIST = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
] as const;

export type WatchlistSymbol = (typeof WATCHLIST)[number];

export const SYMBOL_LABELS: Record<string, string> = {
  BTCUSDT: "Bitcoin",
  ETHUSDT: "Ethereum",
  SOLUSDT: "Solana",
  BNBUSDT: "BNB",
  XRPUSDT: "XRP",
  DOGEUSDT: "Dogecoin",
};

export interface Ticker24hr {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  priceChange: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export interface LeaderboardEntry {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  quoteVolume: number;
}

export function toLeaderboardEntry(t: Ticker24hr): LeaderboardEntry {
  return {
    symbol: t.symbol,
    label: SYMBOL_LABELS[t.symbol] ?? t.symbol.replace(/USDT$/, ""),
    price: Number(t.lastPrice),
    changePercent: Number(t.priceChangePercent),
    quoteVolume: Number(t.quoteVolume),
  };
}

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const maximumFractionDigits = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function coinLabel(symbol: string): string {
  return SYMBOL_LABELS[symbol] ?? symbol.replace(/USDT$/, "");
}
