"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  MonthlyTrendChart,
  CategoryPieChart,
  ComparisonBarChart,
} from "@/components/dashboard/DashboardCharts";
import RatesCard from "@/components/dashboard/RatesCard";

type Account = {
  id: string;
  currency: "TRY" | "USD" | "EUR";
  balance: number;
};

type Tx = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  currency?: "TRY" | "USD" | "EUR";
  categoryId?: string | null;
  categoryName?: string | null;
  createdAt?: any;
};

type Category = {
  id: string;
  name: string;
  kind: "deposit" | "withdraw";
};

type CurrencySettings = {
  base: "TRY" | "USD" | "EUR";
  rates: Record<string, number>;
};

const fmt = (v: number, c: string = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: c }).format(v);

const toDate = (v: any): Date => {
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    base: "TRY",
    rates: { TRY: 1, USD: 34, EUR: 37 },
  });

  useEffect(() => {
    if (!user) return;
    const off = onSnapshot(collection(db, "users", user.uid, "accounts"), (snap) => {
      setAccounts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => off();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("createdAt", "desc")
    );
    const off = onSnapshot(q, (snap) => {
      setTxs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => off();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "categories"), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid, "settings", "currency"), (snap) => {
      if (snap.exists()) {
        setCurrencySettings(snap.data() as CurrencySettings);
      }
    });
  }, [user]);

  const totalsByCurrency = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of accounts) {
      const cur = a.currency || "TRY";
      acc[cur] = (acc[cur] ?? 0) + (a.balance ?? 0);
    }
    return acc;
  }, [accounts]);

  const { monthDeposits, monthWithdraws } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    let deposits = 0;
    let withdraws = 0;

    for (const t of txs) {
      const when = toDate(t.createdAt);
      if (when >= start) {
        const amount = Number(t.amount ?? 0);
        if (t.kind === "deposit") deposits += amount;
        else if (t.kind === "withdraw") withdraws += amount;
      }
    }
    return { monthDeposits: deposits, monthWithdraws: withdraws };
  }, [txs]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">{t.dashboard.totalBalance}</div>
          <div className="mt-2 space-y-1">
            {Object.keys(totalsByCurrency).length === 0 ? (
              <div className="text-sm text-muted-foreground">{t.dashboard.noAccounts}</div>
            ) : (
              Object.entries(totalsByCurrency).map(([cur, val]) => (
                <div key={cur} className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{cur}</span>
                  <span className="text-xl font-semibold">{fmt(val, cur)}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{t.dashboard.accountBalanceTotal}</div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">{t.dashboard.income}</div>
          <div className="mt-2 text-2xl font-semibold text-green-400">
            {fmt(monthDeposits, "TRY")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t.dashboard.thisMonth}</div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">{t.dashboard.expense}</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">
            {fmt(monthWithdraws, "TRY")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t.dashboard.thisMonth}</div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Net</div>
          <div className={`mt-2 text-2xl font-semibold ${monthDeposits - monthWithdraws >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmt(monthDeposits - monthWithdraws, "TRY")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t.dashboard.thisMonth}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyTrendChart transactions={txs} categories={categories} />
        <CategoryPieChart transactions={txs} categories={categories} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComparisonBarChart transactions={txs} categories={categories} />
        <RatesCard cur={currencySettings} />
      </section>
    </div>
  );
}
