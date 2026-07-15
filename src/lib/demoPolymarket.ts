import type { PolymarketPosition, PolymarketTrader } from "./polymarket";

// Deterministic demo data for when Polymarket's public API is unreachable
// or its shape has drifted. Seeded so a given wallet always yields the same
// plausible positions, which lets the auto-mirror engine behave sensibly
// (a trader's "positions" are stable across polls rather than random noise).

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

const HEX = "0123456789abcdef";
function fakeWallet(rand: () => number): string {
  let out = "0x";
  for (let i = 0; i < 40; i++) out += HEX[Math.floor(rand() * 16)];
  return out;
}

const DEMO_NAMES = [
  "0xWhale",
  "OracleEdge",
  "PolySniper",
  "TailRisk",
  "MacroDegen",
  "EventAlpha",
  "SharpMoney",
  "BaseRate",
  null,
  null,
];

const DEMO_MARKETS: { question: string; outcomes: [string, string] }[] = [
  { question: "Will the Fed cut rates at the next meeting?", outcomes: ["Yes", "No"] },
  { question: "Will BTC close above $130k this month?", outcomes: ["Yes", "No"] },
  { question: "US government shutdown before year end?", outcomes: ["Yes", "No"] },
  { question: "Will the incumbent win the next election?", outcomes: ["Yes", "No"] },
  { question: "Will ETH flip $4k this quarter?", outcomes: ["Yes", "No"] },
  { question: "Nvidia to beat earnings estimates?", outcomes: ["Yes", "No"] },
  { question: "Will there be a rate hike in 2026?", outcomes: ["Yes", "No"] },
  { question: "Champions League winner decided by penalties?", outcomes: ["Yes", "No"] },
];

export function generateDemoLeaders(window: string): PolymarketTrader[] {
  const bucket = Math.floor(Date.now() / 60_000);
  const rand = mulberry32(hashString(`leaders:${window}:${bucket}`));
  return Array.from({ length: 10 }, (_, i) => ({
    address: fakeWallet(rand),
    name: DEMO_NAMES[i % DEMO_NAMES.length],
    pnl: Math.round((80_000 - i * 6_000) * (0.7 + rand() * 0.6)),
    volume: Math.round((500_000 - i * 20_000) * (0.6 + rand() * 0.8)),
  })).sort((a, b) => b.pnl - a.pnl);
}

export function generateDemoPositions(address: string): PolymarketPosition[] {
  const rand = mulberry32(hashString(`positions:${address}`));
  const count = 2 + Math.floor(rand() * 4);
  const used = new Set<number>();
  const positions: PolymarketPosition[] = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(rand() * DEMO_MARKETS.length);
    while (used.has(idx)) idx = (idx + 1) % DEMO_MARKETS.length;
    used.add(idx);
    const market = DEMO_MARKETS[idx];
    const outcomeIdx = rand() > 0.5 ? 0 : 1;
    const avgPrice = 0.15 + rand() * 0.7;
    // current price drifts modestly from entry, generally favorable (these
    // are "profitable" traders) but not always.
    const drift = (rand() - 0.35) * 0.18;
    const currentPrice = Math.min(0.97, Math.max(0.03, avgPrice + drift));
    positions.push({
      marketId: `demo-${hashString(market.question)}-${outcomeIdx}`,
      question: market.question,
      outcome: market.outcomes[outcomeIdx],
      shares: Math.round((200 + rand() * 4800) / 10) * 10,
      avgPrice: Number(avgPrice.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
    });
  }
  return positions;
}
