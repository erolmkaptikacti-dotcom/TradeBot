// Shared stock-market constants and types.
//
// Yahoo Finance's public chart endpoint (query1.finance.yahoo.com) requires
// no API key, unlike most stock-data providers (Finnhub, Alpha Vantage,
// etc). It's unofficial/undocumented — same caveat as the Binance
// leaderboard endpoint — but it's the only real, live, keyless option for
// stocks, so that's the tradeoff here.
export const STOCKS_REST_BASE = "https://query1.finance.yahoo.com";

export const STOCK_WATCHLIST = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "TSLA",
  "META",
] as const;

export type StockSymbol = (typeof STOCK_WATCHLIST)[number];

export const STOCK_LABELS: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  AMZN: "Amazon",
  NVDA: "Nvidia",
  TSLA: "Tesla",
  META: "Meta",
};

export interface StockQuote {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  closes: number[];
  marketState: string | null;
}

export function stockLabel(symbol: string): string {
  return STOCK_LABELS[symbol] ?? symbol;
}
