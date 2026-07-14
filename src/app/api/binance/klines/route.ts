import { NextResponse } from "next/server";

const BINANCE_URL = "https://api.binance.com/api/v3/klines";

// Seeds the sparkline with recent closes; live ticks from the WebSocket
// hook are appended client-side after this initial load.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") ?? "1m";
  const limit = searchParams.get("limit") ?? "60";

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const url = new URL(BINANCE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", limit);

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Binance responded with ${res.status}` },
        { status: 502 }
      );
    }
    const raw: unknown[][] = await res.json();
    const closes = raw.map((candle) => Number(candle[4]));
    return NextResponse.json({ symbol, closes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Binance" },
      { status: 502 }
    );
  }
}
