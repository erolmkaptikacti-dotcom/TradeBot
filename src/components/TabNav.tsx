"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Crypto" },
  { href: "/top-traders", label: "Top Traders" },
  { href: "/stocks", label: "Stocks" },
  { href: "/polymarket", label: "Polymarket" },
  { href: "/copy-trading", label: "Copy Trading" },
  { href: "/strategies", label: "Strategies" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border-hairline bg-surface-1/70 px-4 backdrop-blur">
      {TABS.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                style={{ background: "var(--brand-gradient)" }}
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
