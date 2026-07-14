"use client";

import { useEffect, useRef, useState } from "react";
import { BINANCE_WS_BASE } from "@/lib/binance";

export interface LiveTick {
  symbol: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  quoteVolume: number;
  updatedAt: number;
}

interface MiniTickerPayload {
  s: string; // symbol
  c: string; // close (current) price
  o: string; // open price (24h ago)
  h: string; // high price
  l: string; // low price
  q: string; // quote asset volume
}

interface CombinedStreamMessage {
  stream: string;
  data: MiniTickerPayload;
}

const STREAM_BASE = BINANCE_WS_BASE;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;

/**
 * Subscribes to Binance's combined miniTicker WebSocket stream for the
 * given symbols and returns the latest live price/24h-change per symbol.
 * Reconnects with exponential backoff on drop.
 *
 * When `historyLength` is set, a rolling window of recent prices per symbol
 * is also accumulated (inside the same onmessage callback that updates
 * ticks, not a separate effect reacting to `ticks` — that would be deriving
 * state from state).
 */
export function useBinanceTicker(
  symbols: string[],
  options?: { historyLength?: number }
) {
  const historyLength = options?.historyLength;
  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [status, setStatus] = useState<"connecting" | "open" | "closed">(
    "connecting"
  );
  const symbolsKey = symbols.join(",");

  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const closedByEffect = useRef(false);

  useEffect(() => {
    if (symbols.length === 0) return;
    closedByEffect.current = false;

    const streamPath = symbols
      .map((s) => `${s.toLowerCase()}@miniTicker`)
      .join("/");

    function connect() {
      setStatus("connecting");
      const ws = new WebSocket(`${STREAM_BASE}${streamPath}`);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        setStatus("open");
      };

      ws.onmessage = (event) => {
        try {
          const msg: CombinedStreamMessage = JSON.parse(event.data);
          const { s: symbol, c, o, h, l, q } = msg.data;
          const price = Number(c);
          const open = Number(o);
          const changePercent = open > 0 ? ((price - open) / open) * 100 : 0;
          setTicks((prev) => ({
            ...prev,
            [symbol]: {
              symbol,
              price,
              changePercent,
              high: Number(h),
              low: Number(l),
              quoteVolume: Number(q),
              updatedAt: Date.now(),
            },
          }));
          if (historyLength) {
            setHistory((prev) => {
              const arr = prev[symbol] ?? [];
              if (arr[arr.length - 1] === price) return prev;
              return { ...prev, [symbol]: [...arr, price].slice(-historyLength) };
            });
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setStatus("closed");
        if (closedByEffect.current) return;
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt.current,
          RECONNECT_MAX_DELAY_MS
        );
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closedByEffect.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  return { ticks, history, status };
}
