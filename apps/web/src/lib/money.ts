export type Currency = "TRY" | "USD" | "EUR";

export type CurrencySettings = {
  base: Currency;
  rates: Record<Currency, number>;
};

// PARA FORMATLAMA (₺ / $ / €)
export const fmt = (v: number, c: Currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: c,
  }).format(v);

// BİR TUTARI, KAYNAK PARA BİRİMİNDEN BAZ PARA BİRİMİNE ÇEVİR
export const toBase = (
  amount: number,
  from: Currency,
  cur: CurrencySettings
) => {
  const fromRate = Number(cur.rates[from] ?? 1);
  const baseRate = Number(cur.rates[cur.base] ?? 1);
  if (!fromRate || !baseRate) return amount;
  return amount * (fromRate / baseRate);
};

// KUR ORANI FORMATLAMA (1 TRY = 0.0294 USD)
export const fmtRate = (v: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(v);
