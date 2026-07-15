import { NextResponse } from "next/server";
import {
  POLYMARKET_LEADERBOARD_API,
  type LeaderboardWindow,
  type PolymarketTrader,
} from "@/lib/polymarket";
import { generateDemoLeaders } from "@/lib/demoPolymarket";

interface RawLeader {
  proxyWallet?: string;
  wallet?: string;
  address?: string;
  user?: string;
  name?: string;
  pseudonym?: string;
  profit?: number;
  pnl?: number;
  amount?: number;
  volume?: number;
  vol?: number;
}

function num(...candidates: (number | undefined)[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0;
}

// Attempts Polymarket's public profit leaderboard, normalizing several
// plausible field names; on any failure returns clearly-tagged demo data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const window = (searchParams.get("window") ?? "7d") as LeaderboardWindow;

  try {
    const url = new URL(POLYMARKET_LEADERBOARD_API);
    url.searchParams.set("window", window);
    url.searchParams.set("type", "pnl");
    url.searchParams.set("limit", "10");

    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Polymarket responded with ${res.status}`);

    const body = await res.json();
    const rows: RawLeader[] = Array.isArray(body) ? body : body?.data ?? body?.leaderboard ?? [];
    const leaders: PolymarketTrader[] = rows
      .map((r) => ({
        address: r.proxyWallet ?? r.wallet ?? r.address ?? r.user ?? "",
        name: r.name ?? r.pseudonym ?? null,
        pnl: num(r.profit, r.pnl, r.amount),
        volume: num(r.volume, r.vol),
      }))
      .filter((t) => t.address.length > 0);

    if (leaders.length === 0) throw new Error("No leaders returned");

    return NextResponse.json({ leaders, window, demo: false, updatedAt: Date.now() });
  } catch {
    return NextResponse.json({
      leaders: generateDemoLeaders(window),
      window,
      demo: true,
      updatedAt: Date.now(),
    });
  }
}
