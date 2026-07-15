// Birdeye's trader-analytics API (public-api.birdeye.so) is the real fix
// for "no leaderboard of actual profitable traders" — unlike Binance's
// gainers/losers stand-in, this returns real wallet addresses ranked by
// realized PnL. It requires a paid API key (BIRDEYE_API_KEY env var); see
// https://birdeye.so — without a key this section shows a setup prompt
// instead of data.
export const BIRDEYE_REST_BASE = "https://public-api.birdeye.so";
export const BIRDEYE_CHAIN = "solana";

export type TraderTimeFrame = "today" | "yesterday" | "1W";
export type TraderType = "gainers" | "losers";

export const TIME_FRAME_LABELS: Record<TraderTimeFrame, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "1W": "1 Week",
};

export interface BirdeyeTrader {
  address: string;
  pnl: number;
  volume: number;
  tradeCount: number;
}

export function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function solscanUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}
