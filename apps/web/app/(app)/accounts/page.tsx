"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";

type Account = {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "cash";
  currency: "TRY" | "USD" | "EUR";
  balance: number;
  createdAt?: any;
};



const fmt = (v: number, c = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: c }).format(v);

export default function AccountsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const typeText: Record<Account["type"], string> = {
    checking: t.accounts.types.checking,
    savings: t.accounts.types.savings,
    credit: t.accounts.types.credit,
    cash: t.accounts.types.cash,
  };

  // Liste
  const [rows, setRows] = useState<Account[]>([]);

  // Yeni Hesap modal / form
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    type: Account["type"];
    currency: Account["currency"];
    balance: number; // NaN tutulabilir (input boşken)
  }>({
    name: "",
    type: "checking",
    currency: "TRY",
    balance: 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // HAREKET (Yatır/Çek) modal / form
  const [opOpen, setOpOpen] = useState(false);
  const [opErr, setOpErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [opForm, setOpForm] = useState<{
    kind: "deposit" | "withdraw";
    amount: number; // NaN olabilir
    note: string;
  }>({ kind: "deposit", amount: 0, note: "" });

  // --- Realtime liste
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "accounts"),
      orderBy("createdAt", "desc")
    );
    const off = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }) as Account
      );
      setRows(data);
    });
    return () => off();
  }, [user]);

  const totalByCur = useMemo(() => {
    const acc: Record<string, number> = {};
    rows.forEach((r) => (acc[r.currency] = (acc[r.currency] ?? 0) + (r.balance ?? 0)));
    return acc;
  }, [rows]);

  // --- Yeni Hesap Kaydet
  const submit = async () => {
    try {
      if (!user) return;

      const name = form.name.trim();
      if (name.length < 2) {
        setErr("Account name must be at least 2 characters.");
        return;
      }

      const cleanBalance = Number.isFinite(form.balance) ? Number(form.balance) : 0;

      setSaving(true);
      await addDoc(collection(db, "users", user.uid, "accounts"), {
        name,
        type: form.type,
        currency: form.currency,
        balance: cleanBalance,
        createdAt: serverTimestamp(),
      });
      setSaving(false);

      setOpen(false);
      setForm({ name: "", type: "checking", currency: "TRY", balance: 0 });
      setErr(null);
    } catch (e: any) {
      setSaving(false);
      setErr(e?.message ?? "Error while saving");
    }
  };

  const openNewModal = () => {
    setForm({ name: "", type: "checking", currency: "TRY", balance: 0 });
    setErr(null);
    setOpen(true);
  };

  // --- HAREKET Kaydet (Yatır/Çek)
  const submitOp = async () => {
    try {
      if (!user || !selected) return;

      const cleanAmount = Number.isFinite(opForm.amount) ? Number(opForm.amount) : 0;
      if (cleanAmount <= 0) {
        setOpErr("Amount must be greater than 0");
        return;
      }

      // withdraw ise negatif delta
      const delta = opForm.kind === "deposit" ? cleanAmount : -cleanAmount;

      // 1) Hesap bakiyesini atomik arttır/azalt
      await updateDoc(doc(db, "users", user.uid, "accounts", selected.id), {
        balance: increment(delta),
      });

      // 2) İşlemi kaydet (flat transactions koleksiyonu)
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        accountId: selected.id,
        accountName: selected.name,
        currency: selected.currency,
        kind: opForm.kind, // 'deposit' | 'withdraw'
        amount: cleanAmount,
        note: opForm.note?.trim() || null,
        createdAt: serverTimestamp(),
      });

      setOpOpen(false);
      setSelected(null);
      setOpForm({ kind: "deposit", amount: 0, note: "" });
      setOpErr(null);
    } catch (e: any) {
      setOpErr(e?.message ?? "Error during operation");
    }
  };

  const openOpModal = (acc: Account) => {
    setSelected(acc);
    setOpForm({ kind: "deposit", amount: 0, note: "" });
    setOpErr(null);
    setOpOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Üst başlık + Ekle */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.accounts.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.accounts.subtitle}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90"
        >
          + {t.accounts.addAccount}
        </button>
      </header>

      {/* Liste */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 px-4 py-3 text-xs text-muted-foreground border-b border-border">
          <div className="col-span-5">{t.accounts.accountName}</div>
          <div className="col-span-3">{t.accounts.accountType}</div>
          <div className="col-span-2">{t.accounts.currency}</div>
          <div className="col-span-2 text-right">{t.accounts.balance}</div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{t.accounts.noAccounts}</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/60 last:border-b-0"
            >
              <div className="col-span-5">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{typeText[r.type]}</div>
              </div>
              <div className="col-span-3 text-muted-foreground">{typeText[r.type]}</div>
              <div className="col-span-2">{r.currency}</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-3">
                <span className="font-semibold">{fmt(r.balance ?? 0, r.currency)}</span>
                <button
                  onClick={() => openOpModal(r)}
                  className="text-xs rounded-md border border-border px-2 py-1 hover:bg-card/80"
                  title={t.accounts.movement}
                >
                  {t.accounts.movement}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toplamlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(totalByCur).map(([cur, val]) => (
          <div
            key={cur}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="text-sm text-muted-foreground">{t.accounts.total} ({cur})</div>
            <div className="text-2xl font-semibold mt-1">{fmt(val, cur)}</div>
          </div>
        ))}
      </div>

      {/* Yeni Hesap Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-[420px] rounded-xl bg-card border border-border p-5 shadow-xl">
            <div className="text-lg font-semibold mb-3">{t.accounts.newAccount}</div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">{t.accounts.accountName}</label>
                <input
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ziraat Checking"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{t.accounts.accountType}</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as Account["type"],
                      })
                    }
                  >
                    <option value="checking">{t.accounts.types.checking}</option>
                    <option value="savings">{t.accounts.types.savings}</option>
                    <option value="credit">{t.accounts.types.credit}</option>
                    <option value="cash">{t.accounts.types.cash}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">{t.accounts.currency}</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    value={form.currency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currency: e.target.value as Account["currency"],
                      })
                    }
                  >
                    <option>TRY</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">{t.accounts.initialBalance}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={Number.isFinite(form.balance) ? form.balance : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({
                      ...form,
                      balance: v === "" ? (NaN as unknown as number) : e.target.valueAsNumber,
                    });
                  }}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Preview: {fmt(Number.isFinite(form.balance) ? Number(form.balance) : 0, form.currency)}
                </div>
              </div>

              {err && <div className="text-xs text-[#F44336]">{err}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80"
                >
                  {t.common.cancel}
                </button>
                <button
                  disabled={saving}
                  onClick={submit}
                  className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HAREKET Modal (Yatır / Çek) */}
      {opOpen && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-[420px] rounded-xl bg-card border border-border p-5 shadow-xl">
            <div className="text-lg font-semibold mb-1">{t.accounts.accountMovement}</div>
            <div className="text-xs text-muted-foreground mb-4">
              {selected.name} — {selected.currency}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setOpForm({ ...opForm, kind: "deposit" })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm border ${opForm.kind === "deposit"
                    ? "bg-[#00BCD4] text-black border-transparent"
                    : "border-border hover:bg-card/80"
                    }`}
                >
                  {t.accounts.deposit}
                </button>
                <button
                  onClick={() => setOpForm({ ...opForm, kind: "withdraw" })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm border ${opForm.kind === "withdraw"
                    ? "bg-[#00BCD4] text:black border-transparent"
                    : "border-border hover:bg-card/80"
                    }`}
                >
                  {t.accounts.withdraw}
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">{t.accounts.amount}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={Number.isFinite(opForm.amount) ? opForm.amount : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOpForm({
                      ...opForm,
                      amount: v === "" ? (NaN as unknown as number) : e.target.valueAsNumber,
                    });
                  }}
                  placeholder={`e.g. 100.00 ${selected.currency}`}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">{t.accounts.noteOptional}</label>
                <input
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={opForm.note}
                  onChange={(e) => setOpForm({ ...opForm, note: e.target.value })}
                  placeholder="Description"
                />
              </div>

              {opErr && <div className="text-xs text-[#F44336]">{opErr}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setOpOpen(false);
                    setSelected(null);
                    setOpErr(null);
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={submitOp}
                  className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
