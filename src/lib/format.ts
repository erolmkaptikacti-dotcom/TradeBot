// Shared formatting helpers used across crypto and stock panels.

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

/** Same as formatUsd, but prefixes positive values with "+" (for PnL). */
export function formatSignedUsd(value: number, opts?: { compact?: boolean }): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatUsd(value, opts)}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
