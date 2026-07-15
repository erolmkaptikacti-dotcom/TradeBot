// Server-only helper for Yahoo Finance's public (keyless, unofficial)
// chart endpoint. Shared by the watchlist route and the per-symbol detail
// chart route so both parse the same response shape once.
import { STOCKS_REST_BASE } from "./stocks";

export interface YahooMeta {
  regularMarketPrice: number;
  previousClose: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketState?: string;
  currency?: string;
}

export interface YahooChartResult {
  meta: YahooMeta;
  timestamp?: number[];
  indicators: {
    quote: [{ close: (number | null)[] }];
  };
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: { description: string } | null;
  };
}

export async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string
): Promise<YahooChartResult> {
  const url = `${STOCKS_REST_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: {
      // Yahoo's unofficial endpoint is more reliable with a browser UA.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    next: { revalidate: 10 },
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance responded with ${res.status}`);
  }
  const body: YahooChartResponse = await res.json();
  const result = body.chart.result?.[0];
  if (!result) {
    throw new Error(body.chart.error?.description ?? "No data returned");
  }
  return result;
}

export function changePercentOf(meta: YahooMeta): number {
  return meta.previousClose > 0
    ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
    : 0;
}
