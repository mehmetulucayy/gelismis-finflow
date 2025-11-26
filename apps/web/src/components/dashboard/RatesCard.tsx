"use client";

import type { CurrencySettings } from "@/lib/money";
import { fmtRate } from "@/lib/money";

export default function RatesCard({ cur }: { cur: CurrencySettings }) {
  // 1 BASE = x XXX (ör: 1 TRY = 0.0294 USD)
  const norm = (code: keyof CurrencySettings["rates"]) =>
    cur.rates[code] / cur.rates[cur.base];

  const rows = (["TRY", "USD", "EUR"] as const)
    .filter((c) => c !== cur.base)
    .map((c) => ({
      code: c,
      text: `1 ${cur.base} = ${fmtRate(norm(c))} ${c}`,
    }));

  return (
    <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">Kur Bilgisi</div>
      <div className="mt-1 text-xl font-semibold">Baz: {cur.base}</div>

      <div className="mt-3 space-y-1">
        {rows.map((r) => (
          <div key={r.code} className="text-sm">
            {r.text}
          </div>
        ))}
      </div>

      <a
        href="/settings/currency"
        className="inline-block mt-3 text-xs rounded-md bg-[#00BCD4] text-black px-2 py-1 hover:opacity-90"
      >
        Düzenle
      </a>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Kurlar raporlama ve toplamlar için kullanılır.
      </p>
    </div>
  );
}
