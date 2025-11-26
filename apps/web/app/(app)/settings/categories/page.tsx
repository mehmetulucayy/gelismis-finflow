"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import ConfirmModal from "@/components/modals/ConfirmModal";

type Cat = { id: string; name: string; kind: "deposit" | "withdraw" };

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [del, setDel] = useState<Cat | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "categories"));
    return onSnapshot(q, s => setRows(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
  }, [user]);

  const add = async () => {
    if (!user || !name.trim()) return;
    await addDoc(collection(db, "users", user.uid, "categories"), { name: name.trim(), kind });
    setName("");
  };

  const confirmDel = async () => {
    if (!user || !del) return;
    await deleteDoc(doc(db, "users", user.uid, "categories", del.id));
    setDel(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.categories.title}</h1>
        <p className="text-sm text-muted-foreground">{t.categories.subtitle}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t.categories.categoryName} className="rounded-lg bg-input border border-border px-3 py-2 text-sm" />
          <select value={kind} onChange={(e) => setKind(e.target.value as any)}
            className="rounded-lg bg-input border border-border px-3 py-2 text-sm">
            <option value="deposit">{t.categories.income}</option>
            <option value="withdraw">{t.categories.expense}</option>
          </select>
          <button onClick={add} className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm font-medium">+ {t.common.add}</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 px-4 py-3 text-xs text-muted-foreground border-b border-border">
          <div className="col-span-6">{t.common.search}</div><div className="col-span-4">{t.categories.type}</div><div className="col-span-2"></div>
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">{t.categories.noCategories}</div>
        ) : rows.map(r => (
          <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/60 last:border-b-0">
            <div className="col-span-6">{r.name}</div>
            <div className="col-span-4 text-muted-foreground">{r.kind === "deposit" ? t.categories.income : t.categories.expense}</div>
            <div className="col-span-2 text-right">
              <button onClick={() => setDel(r)} className="text-red-400 hover:opacity-80 text-sm">{t.common.delete}</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={confirmDel}
        title={t.categories.deleteCategory}
        desc={t.categories.deleteCategoryDesc} />
    </div>
  );
}
