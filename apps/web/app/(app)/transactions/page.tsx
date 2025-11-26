"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
} from "firebase/firestore";
import TransactionFormModal from "@/components/modals/TransactionFormModal";
import TransferModal from "@/components/modals/TransferModal";
import { fmt, toBase, type CurrencySettings } from "@/lib/money";

type Account = {
  id: string;
  name: string;
  currency: "TRY" | "USD" | "EUR";
  balance: number;
};

type Tx = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  currency: "TRY" | "USD" | "EUR";
  accountId: string;
  accountName: string;
  note?: string | null;
  createdAt?: any;
};

const toDate = (v: any): Date =>
  v?.toDate ? v.toDate() : v instanceof Date ? v : new Date();

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rows, setRows] = useState<Tx[]>([]);

  // filtreler
  const [type, setType] = useState<"all" | "deposit" | "withdraw">("all");
  const [accId, setAccId] = useState<string>("all");
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // modallar
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  // kur & baz para ayarları
  const [cur, setCur] = useState<CurrencySettings>({
    base: "TRY",
    rates: { TRY: 1, USD: 30, EUR: 32 }, // varsayılan; settings dokümanı gelince overwrite edilir
  });

  useEffect(() => {
    if (!user) return;

    // accounts
    const offAcc = onSnapshot(
      collection(db, "users", user.uid, "accounts"),
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as any) } as Account)
        );
        setAccounts(list);
      }
    );

    // transactions
    const offTx = onSnapshot(
      query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        setRows(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Tx))
        );
      }
    );

    // currency settings (users/{uid}/settings/currency)
    const offCur = onSnapshot(
      doc(db, "users", user.uid, "settings", "currency"),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setCur({
            base: (d.base ?? "TRY") as CurrencySettings["base"],
            rates: {
              TRY: Number(d.rates?.TRY ?? 1),
              USD: Number(d.rates?.USD ?? 30),
              EUR: Number(d.rates?.EUR ?? 32),
            },
          });
        }
      }
    );

    return () => {
      offAcc();
      offTx();
      offCur();
    };
  }, [user]);

  const filtered = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    return rows.filter((r) => {
      const d = toDate(r.createdAt);
      if (!(d >= start && d < end)) return false;
      if (type !== "all" && r.kind !== type) return false;
      if (accId !== "all" && r.accountId !== accId) return false;
      return true;
    });
  }, [rows, type, accId, month]);

  // ÜST KARTLAR: baz para birimine çevrilmiş toplamlar
  const totalsBase = useMemo(() => {
    let dep = 0,
      wit = 0;
    for (const r of filtered) {
      const v = toBase(r.amount, r.currency as any, cur);
      if (r.kind === "deposit") dep += v;
      else wit += v;
    }
    return { dep, wit, net: dep - wit, base: cur.base };
  }, [filtered, cur]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.transactions.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.transactions.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80"
          >
            {t.transactions.transfer}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            + {t.transactions.addTransaction}
          </button>
        </div>
      </div>

      {/* Üst kartlar – baz para biriminde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t.transactions.income}</div>
          <div className="text-2xl font-semibold text-emerald-400">
            {fmt(totalsBase.dep, totalsBase.base as any)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t.transactions.expense}</div>
          <div className="text-2xl font-semibold text-red-400">
            {fmt(totalsBase.wit, totalsBase.base as any)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">{t.transactions.net}</div>
          <div
            className={`text-2xl font-semibold ${totalsBase.net >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
          >
            {fmt(totalsBase.net, totalsBase.base as any)}
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t.transactions.type}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            >
              <option value="all">{t.transactions.all}</option>
              <option value="deposit">{t.transactions.income}</option>
              <option value="withdraw">{t.transactions.expense}</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">{t.transactions.account}</label>
            <select
              value={accId}
              onChange={(e) => setAccId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            >
              <option value="all">{t.transactions.all}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">{t.transactions.month}</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Liste (tutar: orijinal para birimiyle) */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 px-4 py-3 text-xs text-muted-foreground border-b border-border">
          <div className="col-span-4">{t.transactions.account}</div>
          <div className="col-span-2">{t.transactions.type}</div>
          <div className="col-span-2">{t.accounts.amount}</div>
          <div className="col-span-2">{t.transactions.date}</div>
          <div className="col-span-2">{t.accounts.note}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{t.transactions.noTransactions}</div>
        ) : (
          filtered.map((r) => {
            const d = toDate(r.createdAt);
            return (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/60 last:border-b-0"
              >
                <div className="col-span-4 font-medium">{r.accountName}</div>
                <div className="col-span-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${r.kind === "deposit"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                      }`}
                  >
                    {r.kind === "deposit" ? t.transactions.income : t.transactions.expense}
                  </span>
                </div>
                <div className="col-span-2">
                  {fmt(r.amount, r.currency as any)}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US")}
                </div>
                <div className="col-span-2 text-muted-foreground truncate">
                  {r.note ?? "-"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modallar */}
      <TransactionFormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        accounts={accounts}
      />
      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        accounts={accounts}
      />
    </div>
  );
}
