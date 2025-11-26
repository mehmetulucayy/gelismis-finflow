"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { fmt } from "@/lib/money";

type Budget = {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: "monthly" | "yearly";
  categoryId?: string | null;
  categoryName?: string | null;
  startDate?: any;
  endDate?: any;
  createdAt?: any;
};

type Category = {
  id: string;
  name: string;
  kind: "deposit" | "withdraw";
};

type Transaction = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  categoryId?: string | null;
  createdAt?: any;
};

const toDate = (v: any): Date =>
  v?.toDate ? v.toDate() : v instanceof Date ? v : new Date();

export default function BudgetsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Data
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    amount: 0,
    period: "monthly" as "monthly" | "yearly",
    categoryId: "",
  });

  // Fetch budgets
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "budgets"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setBudgets(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    });
  }, [user]);

  // Fetch categories (only withdraw/expense categories)
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        setCategories(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((c) => c.kind === "withdraw")
        );
      }
    );
  }, [user]);

  // Fetch transactions to calculate spent amounts
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db, "users", user.uid, "transactions"),
      (snap) => {
        setTransactions(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );
      }
    );
  }, [user]);

  // Calculate spent amount for each budget
  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return budgets.map((budget) => {
      let spent = 0;

      // Filter transactions based on period
      const relevantTxs = transactions.filter((tx) => {
        if (tx.kind !== "withdraw") return false;

        const txDate = toDate(tx.createdAt);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();

        // Period filter
        if (budget.period === "monthly") {
          if (txMonth !== currentMonth || txYear !== currentYear) return false;
        } else {
          // yearly
          if (txYear !== currentYear) return false;
        }

        // Category filter
        if (budget.categoryId) {
          return tx.categoryId === budget.categoryId;
        }

        return true;
      });

      spent = relevantTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      return { ...budget, spent };
    });
  }, [budgets, transactions]);

  // Open modal for new budget
  const openNewModal = () => {
    setEditingBudget(null);
    setForm({
      name: "",
      amount: 0,
      period: "monthly",
      categoryId: "",
    });
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setForm({
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.categoryId || "",
    });
    setShowModal(true);
  };

  // Save budget
  const saveBudget = async () => {
    if (!user || !form.name.trim() || form.amount <= 0) return;

    const categoryName = categories.find((c) => c.id === form.categoryId)?.name || null;

    const data = {
      name: form.name.trim(),
      amount: form.amount,
      period: form.period,
      categoryId: form.categoryId || null,
      categoryName,
    };

    if (editingBudget) {
      // Update
      await updateDoc(doc(db, "users", user.uid, "budgets", editingBudget.id), data);
    } else {
      // Create
      await addDoc(collection(db, "users", user.uid, "budgets"), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }

    setShowModal(false);
  };

  // Delete budget
  const confirmDelete = async () => {
    if (!user || !deleteBudget) return;
    await deleteDoc(doc(db, "users", user.uid, "budgets", deleteBudget.id));
    setDeleteBudget(null);
  };

  // Calculate progress percentage
  const getProgress = (spent: number, amount: number) => {
    if (amount === 0) return 0;
    return Math.min((spent / amount) * 100, 100);
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress < 70) return "bg-emerald-500";
    if (progress < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.budgets.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.budgets.subtitle}
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90"
        >
          + {t.budgets.addBudget}
        </button>
      </header>

      {/* Budget Cards */}
      {budgetsWithSpent.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <svg
              className="mx-auto mb-3 opacity-50"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm4 2v4h4v-4H7z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t.budgets.noBudgets}
          </p>
          <button
            onClick={openNewModal}
            className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm hover:opacity-90"
          >
            {t.budgets.createFirst}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsWithSpent.map((budget) => {
            const progress = getProgress(budget.spent, budget.amount);
            const remaining = budget.amount - budget.spent;
            const isOverBudget = budget.spent > budget.amount;

            return (
              <div
                key={budget.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-[#00BCD4]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{budget.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {budget.period === "monthly" ? t.budgets.monthly : t.budgets.yearly}
                      {budget.categoryName && ` • ${budget.categoryName}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="text-xs text-[#00BCD4] hover:opacity-80"
                      title={t.common.edit}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setDeleteBudget(budget)}
                      className="text-xs text-red-400 hover:opacity-80"
                      title={t.common.delete}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {fmt(budget.spent, "TRY")} / {fmt(budget.amount, "TRY")}
                    </span>
                    <span
                      className={
                        isOverBudget ? "text-red-400" : "text-muted-foreground"
                      }
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-input rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Remaining */}
                <div className="text-sm">
                  {isOverBudget ? (
                    <span className="text-red-400">
                      {t.budgets.exceeded.replace("{amount}", fmt(Math.abs(remaining), "TRY"))}
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      {fmt(remaining, "TRY")} {t.budgets.remaining}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-[480px] max-w-[92vw] rounded-xl bg-card border border-border p-5 shadow-xl">
            <div className="text-lg font-semibold mb-4">
              {editingBudget ? t.budgets.editBudget : t.budgets.newBudget}
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-xs text-muted-foreground">{t.budgets.budgetName}</label>
                <input
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn. Market Harcamaları"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-muted-foreground">{t.budgets.amount} (TRY)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.valueAsNumber || 0 })
                  }
                  placeholder="5000"
                />
              </div>

              {/* Period */}
              <div>
                <label className="text-xs text-muted-foreground">{t.budgets.period}</label>
                <select
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.period}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      period: e.target.value as "monthly" | "yearly",
                    })
                  }
                >
                  <option value="monthly">{t.budgets.monthly}</option>
                  <option value="yearly">{t.budgets.yearly}</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-muted-foreground">
                  {t.budgets.categoryOptional}
                </label>
                <select
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">{t.budgets.allExpenses}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t.budgets.categoryNote}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={saveBudget}
                disabled={!form.name.trim() || form.amount <= 0}
                className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteBudget}
        onClose={() => setDeleteBudget(null)}
        onConfirm={confirmDelete}
        title={t.budgets.deleteBudget}
        desc={t.budgets.deleteBudgetDesc}
      />
    </div>
  );
}
