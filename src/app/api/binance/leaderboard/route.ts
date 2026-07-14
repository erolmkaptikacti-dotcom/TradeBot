import { NextResponse } from "next/server";
import { BINANCE_REST_BASE, toLeaderboardEntry, type Ticker24hr } from "@/lib/binance";

const BINANCE_URL = `${BINANCE_REST_BASE}/api/v3/ticker/24hr`;

// Real 24h "top gainers / top losers" leaderboard, derived from Binance's
// full public ticker feed. This stands in for a "most profitable traders"
// leaderboard, which no exchange exposes without partner API access — this
// is the closest live, keyless equivalent: real coins, real 24h PnL.
// Binance.US lists far fewer pairs with far lower volume than global
// Binance, so the floor here is much lower than it would be on binance.com.
const MIN_QUOTE_VOLUME_USDT = 100_000;
const TOP_N = 10;

export async function GET() {
  try {
    const res = await fetch(BINANCE_URL, { next: { revalidate: 15 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Binance responded with ${res.status}` },
        { status: 502 }
      );
    }
    const all: Ticker24hr[] = await res.json();

    const usdtPairs = all
      .filter((t) => t.symbol.endsWith("USDT"))
      .filter((t) => Number(t.quoteVolume) >= MIN_QUOTE_VOLUME_USDT)
      .map(toLeaderboardEntry);

    const gainers = [...usdtPairs]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, TOP_N);

    const losers = [...usdtPairs]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, TOP_N);

    return NextResponse.json({ gainers, losers, updatedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Binance" },
      { status: 502 }
    );
  }
}
