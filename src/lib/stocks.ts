// Shared stock-market constants and types.
//
// Yahoo Finance's public chart endpoint (query1.finance.yahoo.com) requires
// no API key, unlike most stock-data providers (Finnhub, Alpha Vantage,
// etc). It's unofficial/undocumented — same caveat as the Binance
// leaderboard endpoint — but it's the only real, live, keyless option for
// stocks. The same endpoint also serves indices, futures/commodities, and
// crypto pairs under the same ticker shape, so the watchlist below mixes
// individual stocks with broader market benchmarks.
export const STOCKS_REST_BASE = "https://query1.finance.yahoo.com";

export const STOCK_WATCHLIST = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "TSLA",
  "META",
  "^IXIC",
  "^GSPC",
  "GC=F",
  "CL=F",
  "BTC-USD",
  "ETH-USD",
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
  "^IXIC": "Nasdaq Composite",
  "^GSPC": "S&P 500",
  "GC=F": "Gold",
  "CL=F": "Crude Oil (WTI)",
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
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

export type ChartRange = "1D" | "5D" | "1M" | "6M" | "1Y";

export const CHART_RANGE_CONFIG: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

export interface StockChartPoint {
  time: number;
  close: number;
}

export interface StockDetail {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  marketState: string | null;
  points: StockChartPoint[];
}

export function stockLabel(symbol: string): string {
  return STOCK_LABELS[symbol] ?? symbol;
}
