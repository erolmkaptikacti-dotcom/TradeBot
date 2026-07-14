export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border-hairline bg-surface-1 px-5 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold tracking-tight text-text-primary">
          TradeBot
        </span>
        <span className="text-xs text-text-muted">Trading Dashboard</span>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border-hairline bg-surface-2 px-3 py-1 text-[11px] text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-status-warning" aria-hidden />
        Paper trading · live Binance data
      </div>
    </header>
  );
}
