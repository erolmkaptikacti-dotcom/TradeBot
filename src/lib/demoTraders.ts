import type { BirdeyeTrader, TraderTimeFrame, TraderType } from "./birdeye";

// Simulated fallback data for when BIRDEYE_API_KEY isn't set, so the Top
// Traders tab always shows something instead of an empty setup prompt.
// Clearly tagged `demo: true` in the API response — the UI must label it
// as such. Values drift on a fixed time bucket (matching the client's poll
// interval) so it feels live across polls without being pure noise on
// every request within that window.

const DEMO_BUCKET_MS = 20_000;
const TRADER_COUNT = 10;
const ADDRESS_CHARS =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; // base58 alphabet

// mulberry32: tiny seeded PRNG, deterministic for a given seed.
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
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function fakeAddress(rand: () => number): string {
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += ADDRESS_CHARS[Math.floor(rand() * ADDRESS_CHARS.length)];
  }
  return out;
}

export function generateDemoTraders(type: TraderType, timeFrame: TraderTimeFrame): BirdeyeTrader[] {
  const bucket = Math.floor(Date.now() / DEMO_BUCKET_MS);
  const seed = hashString(`${type}:${timeFrame}:${bucket}`);
  const rand = mulberry32(seed);

  const sign = type === "gainers" ? 1 : -1;
  const traders: BirdeyeTrader[] = Array.from({ length: TRADER_COUNT }, () => {
    const magnitude = 300 + rand() * 49_700; // $300 – $50,000
    return {
      address: fakeAddress(rand),
      pnl: sign * magnitude,
      volume: 5_000 + rand() * 495_000,
      tradeCount: Math.round(3 + rand() * 197),
    };
  });

  traders.sort((a, b) => (type === "gainers" ? b.pnl - a.pnl : a.pnl - b.pnl));
  return traders;
}
