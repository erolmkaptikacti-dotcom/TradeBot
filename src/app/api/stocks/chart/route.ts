import { NextResponse } from "next/server";
import {
  CHART_RANGE_CONFIG,
  stockLabel,
  type ChartRange,
  type StockChartPoint,
  type StockDetail,
} from "@/lib/stocks";
import { changePercentOf, fetchYahooChart } from "@/lib/yahoo";

// Per-symbol detail chart: closes + timestamps over a selectable range,
// plus richer meta stats than the watchlist needs (52-week band, volume).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const rangeParam = searchParams.get("range") as ChartRange | null;
  const rangeKey: ChartRange =
    rangeParam && rangeParam in CHART_RANGE_CONFIG ? rangeParam : "1D";

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const { range, interval } = CHART_RANGE_CONFIG[rangeKey];

  try {
    const result = await fetchYahooChart(symbol, range, interval);
    const { meta } = result;

    const timestamps = result.timestamp ?? [];
    const closes = result.indicators.quote[0]?.close ?? [];
    const points: StockChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close !== null && close !== undefined) {
        points.push({ time: timestamps[i] * 1000, close });
      }
    }

    const detail: StockDetail = {
      symbol,
      label: stockLabel(symbol),
      price: meta.regularMarketPrice,
      changePercent: changePercentOf(meta),
      previousClose: meta.previousClose,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketState: meta.marketState ?? null,
      points,
    };

    return NextResponse.json({ detail, range: rangeKey, updatedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Yahoo Finance" },
      { status: 502 }
    );
  }
}
