"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Item = {
  href: string;
  labelKey: "dashboard" | "accounts" | "transactions" | "budgets" | "reports" | "settings";
  icon: React.ReactElement
};

const icon = {
  dash: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  ),
  wallet: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M21 7H3V5h14l4 2zM3 8h18v11H3V8zm12 3a2 2 0 100 4h4v-4h-4z" />
    </svg>
  ),
  arrows: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M7 7h10l-3-3h2l4 4-4 4h-2l3-3H7V7zm10 10H7l3 3H8l-4-4 4-4h2l-3 3h10v2z" />
    </svg>
  ),
  budget: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm4 2v4h4v-4H7z" />
    </svg>
  ),
  report: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M5 3h10l4 4v14H5V3zm9 1.5V8h3.5L14 4.5zM7 13h3v6H7v-6zm4-3h3v9h-3V10zm4 5h3v4h-3v-4z" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
      <path fill="currentColor" d="M12 8a4 4 0 110 8 4 4 0 010-8zm9 4a7.8 7.8 0 00-.11-1l2.06-1.6-2-3.47-2.46.7a7.9 7.9 0 00-1.73-1l-.37-2.54H9.61L9.24 5.6a7.9 7.9 0 00-1.73 1l-2.46-.7-2 3.47L5.1 11a7.8 7.8 0 000 2l-2.05 1.6 2 3.47 2.46-.7c.54.42 1.12.76 1.73 1l.37 2.54h4.78l.37-2.54c.61-.24 1.19-.58 1.73-1l2.46.7 2-3.47L20.9 13c.07-.33.1-.66.1-1z" />
    </svg>
  ),
};

const items: Item[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: icon.dash },
  { href: "/accounts", labelKey: "accounts", icon: icon.wallet },
  { href: "/transactions", labelKey: "transactions", icon: icon.arrows },
  { href: "/budgets", labelKey: "budgets", icon: icon.budget },
  { href: "/reports", labelKey: "reports", icon: icon.report },
  { href: "/settings", labelKey: "settings", icon: icon.settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="w-60 shrink-0">
      <div className="rounded-xl bg-card border border-border shadow-sm p-2">
        <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">Menü</div>

        <nav className="space-y-1.5">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link key={it.href} href={it.href} className="block group" aria-current={active ? "page" : undefined}>
                <div
                  className={[
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-[#00BCD4]/15 text-foreground border border-[#00BCD4]/30"
                      : "text-foreground/80 hover:text-foreground hover:bg-card/80",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded",
                      active ? "bg-[#00BCD4] opacity-100" : "bg-[#00BCD4] opacity-0 group-hover:opacity-50",
                    ].join(" ")}
                  />
                  <span className="grid place-items-center rounded-md bg-muted-foreground/10 border border-border h-7 w-7 text-foreground">
                    {it.icon}
                  </span>
                  <span className="font-medium">{t.nav[it.labelKey]}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
