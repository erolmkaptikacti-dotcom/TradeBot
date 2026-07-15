// Polymarket is an on-chain prediction market (Polygon), so unlike Kalshi
// its traders' positions are public data — which is what makes "copy the
// most profitable traders" actually possible here. We read its public
// leaderboard (top wallets by profit) and per-wallet positions.
//
// The leaderboard endpoint in particular is best-effort (Polymarket's
// public surface is undocumented and shifts), so both routes attempt the
// real API and fall back to clearly-tagged demo data — the copy-trading
// flow is fully exercisable either way. Positions on prediction markets
// are outcome shares priced 0..1 (a share pays $1 if that outcome wins,
// $0 otherwise), not quantities of an asset.
export const POLYMARKET_DATA_API = "https://data-api.polymarket.com";
export const POLYMARKET_LEADERBOARD_API =
  process.env.POLYMARKET_LEADERBOARD_URL ?? "https://lb-api.polymarket.com/leaderboard";

export type LeaderboardWindow = "1d" | "7d" | "30d" | "all";

export const WINDOW_LABELS: Record<LeaderboardWindow, string> = {
  "1d": "24h",
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

export interface PolymarketTrader {
  address: string;
  name: string | null;
  pnl: number;
  volume: number;
}

export interface PolymarketPosition {
  marketId: string;
  question: string;
  outcome: string;
  shares: number;
  avgPrice: number; // 0..1
  currentPrice: number; // 0..1
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function traderDisplayName(trader: Pick<PolymarketTrader, "address" | "name">): string {
  return trader.name && trader.name.trim().length > 0
    ? trader.name
    : shortAddress(trader.address);
}

export function polymarketProfileUrl(address: string): string {
  return `https://polymarket.com/profile/${address}`;
}

/** Price of an outcome share expressed as its implied probability, e.g. 0.62 -> "62¢". */
export function formatCents(price: number): string {
  return `${Math.round(price * 100)}¢`;
}
