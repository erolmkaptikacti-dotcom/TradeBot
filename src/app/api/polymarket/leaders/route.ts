import { NextResponse } from "next/server";
import {
  leaderboardCandidates,
  type LeaderboardWindow,
  type PolymarketTrader,
} from "@/lib/polymarket";
import { generateDemoLeaders } from "@/lib/demoPolymarket";

interface RawLeader {
  proxyWallet?: string;
  wallet?: string;
  address?: string;
  user?: string;
  userName?: string;
  name?: string;
  pseudonym?: string;
  pnl?: number;
  profit?: number;
  amount?: number;
  vol?: number;
  volume?: number;
}

function num(...candidates: (number | undefined)[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0;
}

function mapLeader(r: RawLeader): PolymarketTrader {
  return {
    address: r.proxyWallet ?? r.wallet ?? r.address ?? r.user ?? "",
    name: r.userName ?? r.name ?? r.pseudonym ?? null,
    pnl: num(r.pnl, r.profit, r.amount),
    volume: num(r.volume, r.vol),
  };
}

// Extracts leader rows from the several response shapes Polymarket's
// leaderboard hosts have used: a bare array, {data|leaderboard: [...]}, or
// separate {profit: [...], volume: [...]} arrays (in which case we take
// profit and enrich volume by wallet).
function extractLeaders(body: unknown): PolymarketTrader[] {
  if (Array.isArray(body)) return body.map(mapLeader).filter((t) => t.address);

  const obj = body as Record<string, unknown> | null;
  if (!obj) return [];

  const profit = obj.profit ?? obj.pnl;
  const volume = obj.volume ?? obj.vol;
  if (Array.isArray(profit)) {
    const leaders = (profit as RawLeader[]).map(mapLeader).filter((t) => t.address);
    if (Array.isArray(volume)) {
      const volByWallet = new Map<string, number>();
      for (const v of volume as RawLeader[]) {
        const t = mapLeader(v);
        if (t.address) volByWallet.set(t.address, num(v.volume, v.vol, v.amount));
      }
      for (const l of leaders) {
        if (l.volume === 0 && volByWallet.has(l.address)) l.volume = volByWallet.get(l.address)!;
      }
    }
    return leaders;
  }

  const rows = obj.data ?? obj.leaderboard ?? obj.results;
  if (Array.isArray(rows)) return (rows as RawLeader[]).map(mapLeader).filter((t) => t.address);
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const window = (searchParams.get("window") ?? "7d") as LeaderboardWindow;

  const attempts: string[] = [];
  for (const url of leaderboardCandidates(window, 10)) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        next: { revalidate: 30 },
      });
      if (!res.ok) {
        attempts.push(`${new URL(url).host} → ${res.status}`);
        continue;
      }
      const leaders = extractLeaders(await res.json()).slice(0, 10);
      if (leaders.length === 0) {
        attempts.push(`${new URL(url).host} → 0 rows`);
        continue;
      }
      return NextResponse.json({ leaders, window, demo: false, updatedAt: Date.now() });
    } catch (err) {
      attempts.push(`${new URL(url).host} → ${err instanceof Error ? err.message : "error"}`);
    }
  }

  return NextResponse.json({
    leaders: generateDemoLeaders(window),
    window,
    demo: true,
    reason: attempts.length ? `Live leaderboard unavailable (${attempts.join("; ")})` : "No endpoint configured",
    updatedAt: Date.now(),
  });
}
