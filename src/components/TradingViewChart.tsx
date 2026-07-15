"use client";

import { useEffect, useRef } from "react";

// Embeds TradingView's free Advanced Chart widget. It loads a third-party
// script from s3.tradingview.com that injects an <iframe>, so the chart
// (candlesticks, indicators, drawing tools, its own interval controls)
// comes fully from TradingView — we just hand it a symbol and theme.
export function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous widget (symbol change / strict-mode re-run).
    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      backgroundColor: "rgba(17, 21, 31, 1)",
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={containerRef} className="h-full w-full" />;
}
