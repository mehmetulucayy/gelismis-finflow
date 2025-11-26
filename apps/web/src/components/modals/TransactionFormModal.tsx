"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

type Account = {
  id: string;
  name: string;
  currency: "TRY" | "USD" | "EUR";
  balance: number;
};

type Category = {
  id: string;
  name: string;
  kind: "deposit" | "withdraw";
};

export default function TransactionFormModal({
  open,
  onClose,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // form state
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [accountId, setAccountId] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // kategoriler
  const [categories, setCategories] = useState<Category[]>([]);
  const catsByKind = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  );
  const [categoryId, setCategoryId] = useState<string>("");

  // modal açıldığında varsayılanları ata
  useEffect(() => {
    if (!open) return;
    // varsayılan hesap
    setAccountId((prev) => prev || accounts[0]?.id || "");
    // varsayılan kategori (seçili türe göre ilk uygun)
    setCategoryId(catsByKind[0]?.id || "");
    setAmountStr("");
    setNote("");
  }, [open, accounts, catsByKind]);

  // kategorileri dinle
  useEffect(() => {
    if (!user) return;
    const off = onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Category[]
        );
      }
    );
    return () => off();
  }, [user]);

  // tür değişince uygun ilk kategoriyi seç
  useEffect(() => {
    setCategoryId((prev) => {
      if (!prev) return catsByKind[0]?.id || "";
      // mevcut seçim farklı türe aitse sıfırla
      const stillValid = catsByKind.some((c) => c.id === prev);
      return stillValid ? prev : catsByKind[0]?.id || "";
    });
  }, [kind, catsByKind]);

  const saving = useMemo(
    () => !user || !accountId || !amountStr.trim(),
    [user, accountId, amountStr]
  );

  const save = async () => {
    if (!user) return;
    const acc = accounts.find((a) => a.id === accountId);
    const val = Number(
      amountStr.replaceAll(".", "").replace(",", ".").trim()
    );
    if (!acc || isNaN(val) || val <= 0) return;

    // category meta
    const categoryName =
      categories.find((c) => c.id === categoryId)?.name ?? null;

    await runTransaction(db, async (tx) => {
      const accRef = doc(db, "users", user.uid, "accounts", acc.id);
      const accSnap = await tx.get(accRef);
      const prev = (accSnap.data()?.balance ?? 0) as number;

      // gelir → +, gider → –
      const next =
        kind === "deposit" ? prev + val : prev - val;

      // 1) hesap bakiyesini güncelle
      tx.update(accRef, { balance: next });

      // 2) işlem kaydını ekle
      const trxRef = doc(collection(db, "users", user.uid, "transactions"));
      tx.set(trxRef, {
        kind,
        amount: val,
        currency: acc.currency,
        accountId: acc.id,
        accountName: acc.name,
        categoryId: categoryId || null,
        categoryName,
        note: note || null,
        createdAt: serverTimestamp(),
      });
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
      <div className="w-[560px] max-w-[92vw] rounded-2xl border border-border bg-card p-6">
        <div className="mb-4">
          <div className="text-lg font-semibold">{t.transactions.addTransaction}</div>
          <div className="text-xs text-muted-foreground">
            {kind === "deposit" ? t.transactions.income : t.transactions.expense} transaction
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tür */}
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t.transactions.type}</label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setKind("deposit")}
                className={[
                  "px-3 py-2 text-sm rounded-lg border",
                  kind === "deposit"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-input border-border text-foreground/80",
                ].join(" ")}
              >
                {t.transactions.income}
              </button>
              <button
                onClick={() => setKind("withdraw")}
                className={[
                  "px-3 py-2 text-sm rounded-lg border",
                  kind === "withdraw"
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-input border-border text-foreground/80",
                ].join(" ")}
              >
                {t.transactions.expense}
              </button>
            </div>
          </div>

          {/* Hesap */}
          <div>
            <label className="text-xs text-muted-foreground">{t.transactions.account}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Tutar */}
          <div>
            <label className="text-xs text-muted-foreground">{t.accounts.amount}</label>
            <input
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 1200.50"
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            />
          </div>

          {/* Kategori (türe göre filtreli) */}
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t.transactions.category}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
            >
              {catsByKind.length === 0 ? (
                <option value="">(No categories)</option>
              ) : (
                catsByKind.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {t.transactions.categoriesManage}
            </div>
          </div>

          {/* Not */}
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">{t.accounts.noteOptional}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
              placeholder="Description..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
