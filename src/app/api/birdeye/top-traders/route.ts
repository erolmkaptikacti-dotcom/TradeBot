import { NextResponse } from "next/server";
import {
  BIRDEYE_CHAIN,
  BIRDEYE_REST_BASE,
  type BirdeyeTrader,
  type TraderTimeFrame,
  type TraderType,
} from "@/lib/birdeye";
import { generateDemoTraders } from "@/lib/demoTraders";

// The exact response field names below are our best understanding of
// Birdeye's /trader/gainers-losers endpoint; we read every plausible alias
// for each field so a naming difference degrades to 0 rather than crashing.
// If real data comes back with different field names than these, the
// symptom is stats showing as 0 while addresses still populate correctly —
// tell us what you see in a real response and we'll fix the mapping.
interface RawBirdeyeItem {
  address?: string;
  owner?: string;
  wallet?: string;
  pnl?: number;
  realized_profit?: number;
  total_profit?: number;
  profit?: number;
  volume?: number;
  trade_volume?: number;
  total_volume?: number;
  trade_count?: number;
  txs?: number;
  tx_count?: number;
}

function num(...candidates: (number | undefined)[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type: TraderType = searchParams.get("type") === "losers" ? "losers" : "gainers";
  const timeFrameParam = searchParams.get("timeFrame");
  const timeFrame: TraderTimeFrame =
    timeFrameParam === "yesterday" || timeFrameParam === "1W" ? timeFrameParam : "today";

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      traders: generateDemoTraders(type, timeFrame),
      type,
      timeFrame,
      demo: true,
      updatedAt: Date.now(),
    });
  }

  const url = new URL(`${BIRDEYE_REST_BASE}/trader/gainers-losers`);
  url.searchParams.set("type", type);
  url.searchParams.set("time_frame", timeFrame);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", "0");

  try {
    const res = await fetch(url, {
      headers: {
        "X-API-KEY": apiKey,
        "x-chain": BIRDEYE_CHAIN,
        accept: "application/json",
      },
      next: { revalidate: 20 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Birdeye responded with ${res.status}` },
        { status: 502 }
      );
    }
    const body = await res.json();
    const items: RawBirdeyeItem[] = body?.data?.items ?? [];

    const traders: BirdeyeTrader[] = items
      .map((item) => ({
        address: item.address ?? item.owner ?? item.wallet ?? "",
        pnl: num(item.pnl, item.realized_profit, item.total_profit, item.profit),
        volume: num(item.volume, item.trade_volume, item.total_volume),
        tradeCount: num(item.trade_count, item.txs, item.tx_count),
      }))
      .filter((t) => t.address.length > 0);

    return NextResponse.json({ traders, type, timeFrame, demo: false, updatedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Birdeye" },
      { status: 502 }
    );
  }
}
