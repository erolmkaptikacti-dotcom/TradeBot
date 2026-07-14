# TradeBot

A multi-tab trading dashboard:

- **Crypto** — live 24h leaderboard, real-time market overview, and a
  paper-trading ("mimic trades") panel
- **Top Traders** — the full live leaderboard (top 24h gainers/losers)
- **Stocks** — a real live stock watchlist
- **Strategies** — simple rule-based automation against the paper-trading
  engine (e.g. "buy if price drops 5%")

Built as a starting point for eventually layering on fully automated trading.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- [Binance.US](https://docs.binance.us/) public REST API (proxied through
  Next.js route handlers) and WebSocket miniTicker stream for real, live,
  keyless crypto data. Base URLs live in `src/lib/binance.ts`
  (`BINANCE_REST_BASE` / `BINANCE_WS_BASE`) — global `binance.com` returns
  HTTP 451 for US-based requests (Vercel's default region, and most US
  browsers), so this points at Binance.US instead. If you're deploying
  somewhere binance.com isn't geo-blocked, swap those two constants back.
- Yahoo Finance's public (keyless, unofficial) chart endpoint for real stock
  quotes — see `src/lib/stocks.ts`
- Zustand (+ `persist`) for the local paper-trading engine and the strategy
  store

## How it's structured

- `src/app/page.tsx`, `src/app/top-traders/`, `src/app/stocks/`,
  `src/app/strategies/` — the four tabs, navigated via `TabNav` in the root
  layout (`src/app/layout.tsx`), which also hosts the header and the
  always-on strategy engine.
- `src/app/api/binance/*` — server-side proxies to Binance's public REST API
  (`ticker/24hr`, `klines`), so the browser never talks to Binance directly
  and API usage is cached/shared across clients.
- `src/app/api/stocks/watchlist` — server-side proxy to Yahoo Finance for
  the stock watchlist.
- `src/hooks/useBinanceTicker.ts` — subscribes to Binance's combined
  miniTicker WebSocket stream for live crypto price ticks, with
  reconnect/backoff, and optionally accumulates a rolling price history for
  sparklines.
- `src/store/paperTradingStore.ts` — the paper-trading engine: virtual USD
  balance, positions, and trade history, persisted to `localStorage`. Order
  execution lives behind a single `placeOrder()` seam — swapping that
  function's body for a real broker/exchange call is the whole diff needed
  to go from "mimic trading" to live automated trading, since callers (the
  manual trade form, or the strategy engine) never touch balances or
  positions directly.
- `src/store/strategyStore.ts` + `src/hooks/useStrategyEngine.ts` — the
  automation layer. Strategies are simple rules (symbol, buy/sell, a
  trigger condition, a quantity); the engine hook checks every active
  strategy against live prices on a 3s interval and calls `placeOrder()`
  when a condition is met. It's mounted once at the app root
  (`StrategyEngineRunner`) so it keeps running across tab navigation — but
  only while the browser tab stays open, since there's no server-side
  scheduler behind it yet.
- `src/components/` — panel components per tab (`LeaderboardPanel`,
  `MarketOverviewPanel`, `TradePanel`, `TopTradersPanel`, `StocksPanel`,
  `StrategiesPanel`) plus shared UI (`DeltaBadge`, `PriceSparkline`,
  `TabNav`, `Header`).

### Leaderboard data source

There's no free/keyless API for a "most profitable traders" leaderboard —
that data sits behind exchange partner programs. As a real, live stand-in,
the leaderboard shows the actual top 24h gainers/losers across all Binance
USDT pairs (`src/app/api/binance/leaderboard/route.ts`). This is a natural
place to swap in a specific trader-leaderboard API later if you get access
to one. Binance.US lists far fewer, lower-volume pairs than global Binance,
so the leaderboard's minimum-volume floor is set much lower to match.

### Stocks data source

Yahoo Finance's `/v8/finance/chart` endpoint is unofficial and undocumented
(same caveat as the leaderboard above) but is the only real, live, keyless
option for stock data — every documented provider (Finnhub, Alpha Vantage,
etc.) requires a free API key at minimum. Stock prices are polled every 15s
rather than streamed, and only move while US markets are open.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are required — all data is public. If a sandboxed/restricted
network environment blocks outbound requests to Binance.US or Yahoo
Finance, the panels degrade gracefully (loading / "couldn't reach ___"
states) rather than crashing; everything works normally with standard
internet access (e.g. deployed on Vercel, or run locally on a normal
machine).

## Roadmap

- Swap `placeOrder()` in `paperTradingStore` for a real exchange order call
  to go live
- Move the strategy engine server-side (e.g. a cron-triggered function) so
  it keeps running without a browser tab open
- Add more trigger types to strategies (e.g. moving averages, RSI)
- Real trader-leaderboard data source, if/when one is available
- Paper trading for stocks, mirroring the crypto trade panel
