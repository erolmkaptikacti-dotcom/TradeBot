"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { MarketOverviewPanel } from "@/components/MarketOverviewPanel";
import { TradePanel } from "@/components/TradePanel";
import { WATCHLIST } from "@/lib/binance";

function CryptoDashboard() {
  const searchParams = useSearchParams();
  const deepLinkedSymbol = searchParams.get("symbol");
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    deepLinkedSymbol || WATCHLIST[0]
  );

  return (
    <main className="grid h-full grid-cols-1 lg:grid-cols-[280px_1fr_340px] lg:overflow-hidden">
      <div className="border-b border-border-hairline p-4 lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
        <LeaderboardPanel onSelectSymbol={setSelectedSymbol} />
      </div>
      <div className="border-b border-border-hairline p-4 lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
        <MarketOverviewPanel
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
      </div>
      <div className="p-4 lg:min-h-0 lg:overflow-hidden">
        <TradePanel selectedSymbol={selectedSymbol} />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <CryptoDashboard />
    </Suspense>
  );
}
