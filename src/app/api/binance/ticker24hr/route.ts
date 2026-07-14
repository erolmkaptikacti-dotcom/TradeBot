import { NextResponse } from "next/server";
import type { Ticker24hr } from "@/lib/binance";

const BINANCE_URL = "https://api.binance.com/api/v3/ticker/24hr";

// Proxies Binance's public 24hr ticker so the browser never talks to
// Binance directly (avoids CORS and keeps API usage server-side, where
// we can cache it for all connected clients).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols");

  const url = new URL(BINANCE_URL);
  if (symbols) {
    const list = symbols.split(",").filter(Boolean);
    url.searchParams.set("symbols", JSON.stringify(list));
  }

  try {
    const res = await fetch(url, { next: { revalidate: 5 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Binance responded with ${res.status}` },
        { status: 502 }
      );
    }
    const data: Ticker24hr[] = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Binance" },
      { status: 502 }
    );
  }
}
