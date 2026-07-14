import { formatPercent } from "@/lib/binance";

export function DeltaBadge({ value }: { value: number }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const color = isFlat
    ? "text-text-muted"
    : isUp
    ? "text-status-good"
    : "text-status-critical";
  const icon = isFlat ? "" : isUp ? "▲" : "▼";

  return (
    <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${color}`}>
      {icon && <span aria-hidden>{icon}</span>}
      {formatPercent(value)}
    </span>
  );
}
