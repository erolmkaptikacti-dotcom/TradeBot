# TradeBot

A crypto trading dashboard: a live 24h leaderboard on the left, a real-time
market overview in the middle, and a paper-trading ("mimic trades") panel on
the right. Built as a starting point for eventually layering on an automated
trading bot.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- [Binance.US](https://docs.binance.us/) public REST API (proxied through
  Next.js route handlers) and WebSocket miniTicker stream for real, live,
  keyless market data. Base URLs live in `src/lib/binance.ts`
  (`BINANCE_REST_BASE` / `BINANCE_WS_BASE`) — global `binance.com` returns
  HTTP 451 for US-based requests (Vercel's default region, and most US
  browsers), so this points at Binance.US instead. If you're deploying
  somewhere binance.com isn't geo-blocked, swap those two constants back.
- Zustand (+ `persist`) for the local paper-trading engine

## How it's structured

- `src/app/api/binance/*` — server-side proxies to Binance's public REST API
  (`ticker/24hr`, `klines`), so the browser never talks to Binance directly
  and API usage is cached/shared across clients.
- `src/hooks/useBinanceTicker.ts` — subscribes to Binance's combined
  miniTicker WebSocket stream for live price ticks, with reconnect/backoff.
- `src/store/paperTradingStore.ts` — the paper-trading engine: virtual USD
  balance, positions, and trade history, persisted to `localStorage`. Order
  execution lives behind a single `placeOrder()` seam — swapping that
  function's body for a real broker/exchange call is the whole diff needed
  to go from "mimic trading" to live automated trading, since callers
  (the manual UI today, a strategy loop later) never touch balances or
  positions directly.
- `src/components/` — the three dashboard panels (`LeaderboardPanel`,
  `MarketOverviewPanel`, `TradePanel`) plus shared UI (`DeltaBadge`,
  `PriceSparkline`).

### Leaderboard data source

There's no free/keyless API for a "most profitable traders" leaderboard —
that data sits behind exchange partner programs. As a real, live stand-in,
the leaderboard shows the actual top 24h gainers/losers across all Binance
USDT pairs (`src/app/api/binance/leaderboard/route.ts`). This is a natural
place to swap in a specific trader-leaderboard API later if you get access
to one. Binance.US lists far fewer, lower-volume pairs than global Binance,
so the leaderboard's minimum-volume floor is set much lower to match.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are required — all data is public. If a sandboxed/restricted
network environment blocks outbound requests to `api.binance.com` or the
`stream.binance.com` WebSocket, the panels degrade gracefully (loading /
"couldn't reach Binance" states) rather than crashing; everything works
normally with standard internet access (e.g. deployed on Vercel, or run
locally on a normal machine).

## Roadmap

- Swap `placeOrder()` in `paperTradingStore` for a real exchange order call
  to go live
- Add a strategy/automation loop that calls `placeOrder()` on a schedule or
  signal instead of the manual form
- Real trader-leaderboard data source, if/when one is available
