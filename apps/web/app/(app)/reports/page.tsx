"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { fmt, toBase, type CurrencySettings } from "@/lib/money";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

type Transaction = {
    id: string;
    kind: "deposit" | "withdraw";
    amount: number;
    currency: "TRY" | "USD" | "EUR";
    categoryId?: string | null;
    categoryName?: string | null;
    accountId: string;
    accountName: string;
    createdAt?: any;
};

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

const toDate = (v: any): Date =>
    v?.toDate ? v.toDate() : v instanceof Date ? v : new Date();

const COLORS = [
    "#00BCD4",
    "#4CAF50",
    "#FF9800",
    "#F44336",
    "#9C27B0",
    "#2196F3",
    "#FFEB3B",
    "#E91E63",
];

export default function ReportsPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cur, setCur] = useState<CurrencySettings>({
        base: "TRY",
        rates: { TRY: 1, USD: 30, EUR: 32 },
    });

    // Filter states
    const [period, setPeriod] = useState<"month" | "year" | "all">("month");
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    // Fetch data
    useEffect(() => {
        if (!user) return;

        const offTx = onSnapshot(
            query(
                collection(db, "users", user.uid, "transactions"),
                orderBy("createdAt", "desc")
            ),
            (snap) => {
                setTransactions(
                    snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
                );
            }
        );

        const offAcc = onSnapshot(
            collection(db, "users", user.uid, "accounts"),
            (snap) => {
                setAccounts(
                    snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
                );
            }
        );

        const offCat = onSnapshot(
            collection(db, "users", user.uid, "categories"),
            (snap) => {
                setCategories(
                    snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
                );
            }
        );

        const offCur = onSnapshot(
            collection(db, "users", user.uid, "settings"),
            (snap) => {
                const curDoc = snap.docs.find((d) => d.id === "currency");
                if (curDoc?.exists()) {
                    const d = curDoc.data() as any;
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
            offTx();
            offAcc();
            offCat();
            offCur();
        };
    }, [user]);

    // Filter transactions by period
    const filteredTxs = useMemo(() => {
        const now = new Date();

        return transactions.filter((tx) => {
            const txDate = toDate(tx.createdAt);

            if (period === "month") {
                const [y, m] = selectedMonth.split("-").map(Number);
                return (
                    txDate.getFullYear() === y && txDate.getMonth() === m - 1
                );
            } else if (period === "year") {
                return txDate.getFullYear() === now.getFullYear();
            }

            return true; // all
        });
    }, [transactions, period, selectedMonth]);

    // Summary stats
    const summary = useMemo(() => {
        let income = 0;
        let expense = 0;

        filteredTxs.forEach((tx) => {
            const amount = toBase(tx.amount, tx.currency, cur);
            if (tx.kind === "deposit") income += amount;
            else expense += amount;
        });

        return {
            income,
            expense,
            net: income - expense,
            count: filteredTxs.length,
        };
    }, [filteredTxs, cur]);

    // Category breakdown (expenses only)
    const categoryData = useMemo(() => {
        const map: Record<string, number> = {};

        filteredTxs
            .filter((tx) => tx.kind === "withdraw")
            .forEach((tx) => {
                const name = tx.categoryName || t.dashboard.charts.other;
                const amount = toBase(tx.amount, tx.currency, cur);
                map[name] = (map[name] || 0) + amount;
            });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTxs, cur, t]);

    // Account breakdown
    const accountData = useMemo(() => {
        const map: Record<string, { income: number; expense: number }> = {};

        filteredTxs.forEach((tx) => {
            const name = tx.accountName;
            if (!map[name]) map[name] = { income: 0, expense: 0 };

            const amount = toBase(tx.amount, tx.currency, cur);
            if (tx.kind === "deposit") map[name].income += amount;
            else map[name].expense += amount;
        });

        return Object.entries(map).map(([name, data]) => ({
            name,
            [t.dashboard.income]: data.income,
            [t.dashboard.expense]: data.expense,
        }));
    }, [filteredTxs, cur, t]);

    // Monthly trend (last 6 months)
    const monthlyTrend = useMemo(() => {
        const now = new Date();
        const months: any[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                month: "short",
                year: "2-digit",
            });

            let income = 0;
            let expense = 0;

            transactions.forEach((tx) => {
                const txDate = toDate(tx.createdAt);
                if (
                    txDate.getFullYear() === d.getFullYear() &&
                    txDate.getMonth() === d.getMonth()
                ) {
                    const amount = toBase(tx.amount, tx.currency, cur);
                    if (tx.kind === "deposit") income += amount;
                    else expense += amount;
                }
            });

            months.push({
                name: monthName,
                [t.dashboard.income]: income,
                [t.dashboard.expense]: expense
            });
        }

        return months;
    }, [transactions, cur, t, language]);

    // Export to CSV
    const exportCSV = () => {
        const headers = [t.transactions.date, t.transactions.account, t.transactions.type, t.transactions.category, t.accounts.amount, t.accounts.note];
        const rows = filteredTxs.map((tx) => [
            toDate(tx.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US"),
            tx.accountName,
            tx.kind === "deposit" ? t.transactions.income : t.transactions.expense,
            tx.categoryName || "-",
            tx.amount,
            "", // note field if exists
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `rapor-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{t.reports.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t.reports.subtitle}
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80"
                >
                    📥 {t.reports.downloadCSV}
                </button>
            </header>

            {/* Filters */}
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground">{t.reports.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as any)}
                            className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                        >
                            <option value="month">{t.reports.thisMonth}</option>
                            <option value="year">{t.reports.thisYear}</option>
                            <option value="all">{t.reports.all}</option>
                        </select>
                    </div>

                    {period === "month" && (
                        <div>
                            <label className="text-xs text-muted-foreground">{t.reports.selectMonth}</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{t.reports.totalIncome}</div>
                    <div className="text-2xl font-semibold text-emerald-400 mt-1">
                        {fmt(summary.income, cur.base)}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{t.reports.totalExpense}</div>
                    <div className="text-2xl font-semibold text-red-400 mt-1">
                        {fmt(summary.expense, cur.base)}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{t.reports.net}</div>
                    <div
                        className={`text-2xl font-semibold mt-1 ${summary.net >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                    >
                        {fmt(summary.net, cur.base)}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{t.reports.transactionCount}</div>
                    <div className="text-2xl font-semibold mt-1">{summary.count}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-4">{t.reports.last6Months}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                            <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} />
                            <YAxis stroke="#A0A0A0" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1E1E1E",
                                    border: "1px solid #2C2C2C",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={t.dashboard.income}
                                stroke="#4CAF50"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey={t.dashboard.expense}
                                stroke="#F44336"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Pie Chart */}
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-4">{t.reports.categoryDistribution}</h3>
                    {categoryData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                            {t.reports.noData}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => entry.name}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1E1E1E",
                                        border: "1px solid #2C2C2C",
                                        borderRadius: "8px",
                                    }}
                                    formatter={(value: any) => fmt(value, cur.base)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Account Breakdown */}
                <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                    <h3 className="font-semibold mb-4">{t.reports.accountAnalysis}</h3>
                    {accountData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                            {t.reports.noData}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={accountData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                                <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} />
                                <YAxis stroke="#A0A0A0" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1E1E1E",
                                        border: "1px solid #2C2C2C",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey={t.dashboard.income} fill="#4CAF50" />
                                <Bar dataKey={t.dashboard.expense} fill="#F44336" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Top Categories Table */}
            <div className="rounded-xl border border-border bg-card">
                <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{t.reports.topCategories}</h3>
                </div>
                <div className="divide-y divide-[#2C2C2C]/60">
                    {categoryData.slice(0, 10).map((cat, idx) => {
                        const percentage = (cat.value / summary.expense) * 100;
                        return (
                            <div
                                key={cat.name}
                                className="px-4 py-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {percentage.toFixed(1)}%
                                    </span>
                                    <span className="font-semibold">
                                        {fmt(cat.value, cur.base)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {categoryData.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            {t.reports.noCategoryExpenses}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
