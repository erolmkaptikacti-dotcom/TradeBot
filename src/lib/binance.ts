// Shared Binance constants, types, and formatting helpers.
//
// binance.com's public API/WebSocket returns HTTP 451 (geo-blocked) for
// requests from the US and a few other restricted regions — which is what
// both Vercel's default US region and a US-based browser hit. Binance.US
// is a separate, purpose-built endpoint for US users that mirrors the same
// API shape and isn't geo-blocked, so we point there instead. If you're
// deploying somewhere binance.com isn't blocked, swap these back.
export const BINANCE_REST_BASE = "https://api.binance.us";
export const BINANCE_WS_BASE = "wss://stream.binance.us:9443/stream?streams=";

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

export function coinLabel(symbol: string): string {
  return SYMBOL_LABELS[symbol] ?? symbol.replace(/USDT$/, "");
}
