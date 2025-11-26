"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Currency, CurrencySettings } from "@/lib/money";

const CURRENCIES: Currency[] = ["TRY", "USD", "EUR"];

export default function CurrencySettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cfg, setCfg] = useState<CurrencySettings>({
    base: "TRY",
    rates: { TRY: 1, USD: 30, EUR: 32 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "settings", "currency");
    const off = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as CurrencySettings;
        setCfg({
          base: (d.base as Currency) ?? "TRY",
          rates: {
            TRY: Number(d.rates?.TRY ?? 1),
            USD: Number(d.rates?.USD ?? 30),
            EUR: Number(d.rates?.EUR ?? 32),
          },
        });
      }
      setLoading(false);
    });
    return () => off();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "settings", "currency");
    await setDoc(ref, cfg, { merge: true });
  };

  if (!user || loading) return <div className="p-6">{t.common.loading}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.currencySettings.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.currencySettings.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">{t.currencySettings.baseCurrency}</label>
          <select
            value={cfg.base}
            onChange={(e) => setCfg((p) => ({ ...p, base: e.target.value as Currency }))}
            className="mt-1 rounded-lg bg-input border border-border px-3 py-2 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CURRENCIES.map((c) => (
            <div key={c}>
              <label className="text-xs text-muted-foreground">
                1 {c} = ? {cfg.base}
              </label>
              <input
                inputMode="decimal"
                value={cfg.rates[c]}
                onChange={(e) =>
                  setCfg((p) => ({
                    ...p,
                    rates: { ...p.rates, [c]: Number(e.target.value || 0) },
                  }))
                }
                className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={save} className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium">
            {t.common.save}
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {t.currencySettings.note}
      </div>
    </div>
  );
}
