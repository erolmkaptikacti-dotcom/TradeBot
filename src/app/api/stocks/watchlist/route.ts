import { NextResponse } from "next/server";
import { STOCK_WATCHLIST, stockLabel, type StockQuote } from "@/lib/stocks";
import { changePercentOf, fetchYahooChart } from "@/lib/yahoo";

async function fetchQuote(symbol: string): Promise<StockQuote> {
  const result = await fetchYahooChart(symbol, "1d", "5m");
  const { meta } = result;
  const closes = (result.indicators.quote[0]?.close ?? []).filter(
    (c): c is number => c !== null
  );

  return {
    symbol,
    label: stockLabel(symbol),
    price: meta.regularMarketPrice,
    changePercent: changePercentOf(meta),
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
      {
        error:
          firstError?.reason instanceof Error
            ? firstError.reason.message
            : "Failed to reach Yahoo Finance",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ quotes, updatedAt: Date.now() });
}
