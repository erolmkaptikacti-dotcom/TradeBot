import { NextResponse } from "next/server";
import { POLYMARKET_DATA_API, type PolymarketPosition } from "@/lib/polymarket";
import { generateDemoPositions } from "@/lib/demoPolymarket";

interface RawPosition {
  conditionId?: string;
  asset?: string;
  market?: string;
  title?: string;
  question?: string;
  outcome?: string;
  outcomeIndex?: number;
  size?: number;
  shares?: number;
  avgPrice?: number;
  averagePrice?: number;
  curPrice?: number;
  currentPrice?: number;
  price?: number;
}

function num(...candidates: (number | undefined)[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0;
}

// Returns a wallet's open prediction-market positions. Demo wallets (from
// the demo leaderboard) start with "0x" + 40 hex like real ones; when the
// upstream call fails or returns nothing, we synthesize stable demo
// positions seeded by the address so auto-mirroring stays consistent.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  if (!user) {
    return NextResponse.json({ error: "user is required" }, { status: 400 });
  }

  try {
    const url = new URL(`${POLYMARKET_DATA_API}/positions`);
    url.searchParams.set("user", user);
    url.searchParams.set("sizeThreshold", "1");

    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 20 },
    });
    if (!res.ok) throw new Error(`Polymarket responded with ${res.status}`);

    const body = await res.json();
    const rows: RawPosition[] = Array.isArray(body) ? body : body?.data ?? [];
    const positions: PolymarketPosition[] = rows
      .map((r) => ({
        marketId: r.conditionId ?? r.asset ?? "",
        question: r.title ?? r.question ?? r.market ?? "Unknown market",
        outcome: r.outcome ?? (r.outcomeIndex === 1 ? "No" : "Yes"),
        shares: num(r.size, r.shares),
        avgPrice: num(r.avgPrice, r.averagePrice),
        currentPrice: num(r.curPrice, r.currentPrice, r.price),
      }))
      .filter((p) => p.marketId.length > 0 && p.shares > 0);

    if (positions.length === 0) throw new Error("No positions returned");

    return NextResponse.json({ positions, demo: false, updatedAt: Date.now() });
  } catch {
    return NextResponse.json({
      positions: generateDemoPositions(user),
      demo: true,
      updatedAt: Date.now(),
    });
  }
}
