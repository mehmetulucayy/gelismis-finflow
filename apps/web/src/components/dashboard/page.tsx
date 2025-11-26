"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase.client";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import RatesCard from "@/components/dashboard/RatesCard";
import type { Currency, CurrencySettings } from "@/lib/money";
import { toBase } from "@/lib/money";

/** ---------------- types ---------------- */
type Account = {
  id: string;
  currency: Currency;
  balance: number;
};

type Tx = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  currency?: Currency;
  createdAt?: any; // Firestore Timestamp | Date | undefined
};

/** ---------------- helpers ---------------- */
const fmt = (v: number, c: string = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: c }).format(v);

const toDate = (v: any): Date => {
  if (v?.toDate) return v.toDate();        // Firestore Timestamp
  if (v instanceof Date) return v;         // Date
  return new Date();                       // fallback
};

/** ---------------- page ---------------- */
export default function DashboardPage() {
  const { user } = useAuth();

  /** === Currency Settings (baz & kurlar) ================================ */
  const [cur, setCur] = useState<CurrencySettings>({
    base: "TRY",
    rates: { TRY: 1, USD: 30, EUR: 32 }, // varsayılan; belge yoksa
  });

  useEffect(() => {
    if (!user) return;
    const off = onSnapshot(
      doc(db, "users", user.uid, "settings", "currency"),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as any;
        setCur({
          base: (d.base ?? "TRY") as Currency,
          rates: {
            TRY: Number(d.rates?.TRY ?? 1),
            USD: Number(d.rates?.USD ?? 30),
            EUR: Number(d.rates?.EUR ?? 32),
          },
        });
      }
    );
    return () => off();
  }, [user]);

  /** === Accounts (Toplam Bakiye) ======================================= */
  const [accounts, setAccounts] = useState<Account[]>([]);
  useEffect(() => {
    if (!user) return;
    const off = onSnapshot(
      collection(db, "users", user.uid, "accounts"),
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }) as Account
        );
        setAccounts(rows);
      }
    );
    return () => off();
  }, [user]);

  const totalsByCurrency = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of accounts) {
      const code = a.currency || "TRY";
      acc[code] = (acc[code] ?? 0) + (a.balance ?? 0);
    }
    return acc; // örn { TRY: 12000, USD: 50, EUR: 80 }
  }, [accounts]);

  /** === Transactions (Gelir/Gider)  — ay filtresi client’ta ============= */
  const [txs, setTxs] = useState<Tx[]>([]);
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("createdAt", "desc")
    );
    const off = onSnapshot(q, (snap) => {
      setTxs(
        snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Tx, "id">) }) as Tx
        )
      );
    });
    return () => off();
  }, [user]);

  // Bu ayki gelir/gider (BAZ para biriminde toplanır)
  const { monthDepositsBase, monthWithdrawsBase } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    let depBase = 0;
    let witBase = 0;

    for (const t of txs) {
      const when = toDate(t.createdAt);
      if (when >= start) {
        const amt = Number(t.amount ?? 0);
        const fromCur = (t.currency ?? cur.base) as Currency;
        const baseAmt = toBase(amt, fromCur, cur);
        if (t.kind === "deposit") depBase += baseAmt;
        else if (t.kind === "withdraw") witBase += baseAmt;
      }
    }
    return { monthDepositsBase: depBase, monthWithdrawsBase: witBase };
  }, [txs, cur]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Özetlerin burada.</p>
      </header>

      {/* 4’lü kart: Toplam Bakiye, Gelir, Gider, Kur Bilgisi */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Toplam Bakiye */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Toplam Bakiye</div>
          <div className="mt-2 space-y-1">
            {Object.keys(totalsByCurrency).length === 0 ? (
              <div className="text-sm text-muted-foreground">Hesap yok</div>
            ) : (
              Object.entries(totalsByCurrency).map(([code, val]) => (
                <div key={code} className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {code}
                  </span>
                  <span className="text-xl font-semibold">{fmt(val, code)}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Hesap bakiyelerinin toplamı (real-time).
          </div>
        </div>

        {/* GELİR (baz cinsinden, bu ay) */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Gelir</div>
          <div className="mt-2 text-2xl font-semibold text-green-400">
            {fmt(monthDepositsBase, cur.base)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Bu ay (baz: {cur.base})</div>
        </div>

        {/* GİDER (baz cinsinden, bu ay) */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Gider</div>
          <div className="mt-2 text-2xl font-semibold text-red-400">
            {fmt(monthWithdrawsBase, cur.base)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Bu ay (baz: {cur.base})</div>
        </div>

        {/* Kur Bilgisi kartı */}
        <RatesCard cur={cur} />
      </section>
    </div>
  );
}
