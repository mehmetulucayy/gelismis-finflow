"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/firebase.client";
import { doc, runTransaction, serverTimestamp, collection } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Account = { id: string; name: string; currency: "TRY" | "USD" | "EUR"; balance: number; };

export default function TransferModal({
  open, onClose, accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const from = useMemo(() => accounts.find(a => a.id === fromId), [accounts, fromId]);
  const to = useMemo(() => accounts.find(a => a.id === toId), [accounts, toId]);
  const sameCurrency = from && to && from.currency === to.currency;

  const save = async () => {
    if (!user || !from || !to || from.id === to.id) return;
    const val = Number(amount);
    if (!isFinite(val) || val <= 0) return;

    setLoading(true);
    try {
      await runTransaction(db, async (tx) => {
        const fromRef = doc(db, "users", user.uid, "accounts", from.id);
        const toRef = doc(db, "users", user.uid, "accounts", to.id);

        const sFrom = await tx.get(fromRef);
        const sTo = await tx.get(toRef);
        const newFrom = (sFrom.data()?.balance ?? 0) - val;
        const newTo = (sTo.data()?.balance ?? 0) + val;
        if (newFrom < 0) throw new Error("Insufficient balance");

        tx.update(fromRef, { balance: newFrom });
        tx.update(toRef, { balance: newTo });

        const trCol = collection(db, "users", user.uid, "transactions");
        tx.set(doc(trCol), {
          kind: "withdraw", amount: val, currency: from.currency,
          accountId: from.id, accountName: from.name,
          note: note ? `Transfer → ${to.name} • ${note}` : `Transfer → ${to.name}`,
          createdAt: serverTimestamp(),
        });
        tx.set(doc(trCol), {
          kind: "deposit", amount: val, currency: to.currency,
          accountId: to.id, accountName: to.name,
          note: note ? `Transfer ← ${from.name} • ${note}` : `Transfer ← ${from.name}`,
          createdAt: serverTimestamp(),
        });
      });

      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
      <div className="w-[560px] max-w-[92vw] rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">{t.transactions.transfer}</div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:opacity-80">{t.common.close}</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Source Account</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm">
              <option value="" disabled>Select</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Target Account</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm">
              <option value="" disabled>Select</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">{t.accounts.amount}</label>
            <input inputMode="decimal" className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
              placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t.accounts.currency}</label>
            <div className="mt-1 text-sm text-muted-foreground">
              {sameCurrency ? from?.currency : "⚠️ Different currency (no conversion)"}
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t.accounts.noteOptional}</label>
            <input className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
              value={note} onChange={(e) => setNote(e.target.value)} placeholder="Description" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-card/80">{t.common.cancel}</button>
          <button onClick={save} disabled={!from || !to}
            className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            Make Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
