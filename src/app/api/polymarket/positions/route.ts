import { NextResponse } from "next/server";
import { POLYMARKET_DATA_API, type PolymarketPosition } from "@/lib/polymarket";
import { generateDemoPositions } from "@/lib/demoPolymarket";

// Confirmed shape of data-api.polymarket.com/positions (fully public, no
// auth): size = shares, avgPrice/curPrice are 0..1, title = market question,
// conditionId identifies the market, outcome = "Yes"/"No".
interface RawPosition {
  proxyWallet?: string;
  asset?: string;
  conditionId?: string;
  size?: number;
  avgPrice?: number;
  curPrice?: number;
  title?: string;
  outcome?: string;
  outcomeIndex?: number;
}

function num(...candidates: (number | undefined)[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  if (!user) {
    return NextResponse.json({ error: "user is required" }, { status: 400 });
  }

  // Demo traders (from a demo leaderboard) carry fake wallets that the real
  // API would just return empty for, so the caller passes demo=1 to get
  // matching demo positions. Real traders never pass this flag.
  if (searchParams.get("demo") === "1") {
    return NextResponse.json({
      positions: generateDemoPositions(user),
      demo: true,
      updatedAt: Date.now(),
    });
  }

  const url = new URL(`${POLYMARKET_DATA_API}/positions`);
  url.searchParams.set("user", user);
  url.searchParams.set("sizeThreshold", "1");
  url.searchParams.set("sortBy", "CURRENT");
  url.searchParams.set("sortDirection", "DESC");
  url.searchParams.set("limit", "20");

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 20 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const body = await res.json();
    const rows: RawPosition[] = Array.isArray(body) ? body : body?.data ?? [];
    const positions: PolymarketPosition[] = rows
      .map((r) => ({
        marketId: r.conditionId ?? r.asset ?? "",
        question: r.title ?? "Unknown market",
        outcome: r.outcome ?? (r.outcomeIndex === 1 ? "No" : "Yes"),
        shares: num(r.size),
        avgPrice: num(r.avgPrice),
        currentPrice: num(r.curPrice),
      }))
      .filter((p) => p.marketId.length > 0 && p.shares > 0);

    // A real wallet legitimately can have zero open positions — return that
    // as real (empty) rather than masking it with demo data.
    return NextResponse.json({ positions, demo: false, updatedAt: Date.now() });
  } catch (err) {
    return NextResponse.json({
      positions: generateDemoPositions(user),
      demo: true,
      reason: `Live positions unavailable (${err instanceof Error ? err.message : "error"})`,
      updatedAt: Date.now(),
    });
  }
}
