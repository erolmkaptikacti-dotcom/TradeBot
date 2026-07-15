export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border-hairline bg-surface-1/70 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(77,141,255,0.4)]"
          style={{ background: "var(--brand-gradient)" }}
          aria-hidden
        >
          T
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-text-primary">
            TradeBot
          </span>
          <span className="hidden text-xs text-text-muted sm:inline">Trading Dashboard</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border-hairline bg-surface-2 px-3 py-1 text-[11px] text-text-secondary">
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-warning opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-warning" />
        </span>
        Paper trading · live market data
      </div>
    </header>
  );
}
