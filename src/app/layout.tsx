import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { StrategyEngineRunner } from "@/components/StrategyEngineRunner";

export const metadata: Metadata = {
  title: "TradeBot",
  description: "Crypto trading dashboard — live leaderboard, market data, and paper trading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-screen flex-col bg-surface-0 lg:h-screen">
          <Header />
          <TabNav />
          <div className="flex-1 lg:min-h-0 lg:overflow-hidden">{children}</div>
        </div>
        <StrategyEngineRunner />
      </body>
    </html>
  );
}
