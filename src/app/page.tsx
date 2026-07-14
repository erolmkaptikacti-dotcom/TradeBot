"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { MarketOverviewPanel } from "@/components/MarketOverviewPanel";
import { TradePanel } from "@/components/TradePanel";
import { WATCHLIST } from "@/lib/binance";

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(WATCHLIST[0]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-0 lg:h-screen">
      <Header />
      <main className="grid grid-cols-1 gap-px bg-border-hairline lg:min-h-0 lg:flex-1 lg:grid-cols-[280px_1fr_340px] lg:overflow-hidden">
        <div className="bg-surface-0 p-4 lg:min-h-0 lg:overflow-hidden">
          <LeaderboardPanel onSelectSymbol={setSelectedSymbol} />
        </div>
        <div className="bg-surface-0 p-4 lg:min-h-0 lg:overflow-hidden">
          <MarketOverviewPanel
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
        </div>
        <div className="bg-surface-0 p-4 lg:min-h-0 lg:overflow-hidden">
          <TradePanel selectedSymbol={selectedSymbol} />
        </div>
      </main>
    </div>
  );
}
