import { NextResponse } from "next/server";
import { STOCKS_REST_BASE, STOCK_WATCHLIST, stockLabel, type StockQuote } from "@/lib/stocks";

interface YahooChartResult {
  meta: {
    regularMarketPrice: number;
    previousClose: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    marketState?: string;
  };
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

async function fetchQuote(symbol: string): Promise<StockQuote> {
  const url = `${STOCKS_REST_BASE}/v8/finance/chart/${symbol}?range=1d&interval=5m`;
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

  const { meta } = result;
  const closes = (result.indicators.quote[0]?.close ?? []).filter(
    (c): c is number => c !== null
  );
  const changePercent =
    meta.previousClose > 0
      ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
      : 0;

  return {
    symbol,
    label: stockLabel(symbol),
    price: meta.regularMarketPrice,
    changePercent,
    high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
    low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
    closes,
    marketState: meta.marketState ?? null,
  };
}

// Proxies Yahoo Finance's public (keyless) chart endpoint for the stock
// watchlist, so the browser never talks to Yahoo directly.
export async function GET() {
  const settled = await Promise.allSettled(STOCK_WATCHLIST.map(fetchQuote));

  const quotes = settled
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);

  if (quotes.length === 0) {
    const firstError = settled.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    return NextResponse.json(
      { error: firstError?.reason instanceof Error ? firstError.reason.message : "Failed to reach Yahoo Finance" },
      { status: 502 }
    );
  }

  return NextResponse.json({ quotes, updatedAt: Date.now() });
}
