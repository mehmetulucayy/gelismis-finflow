"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { fmt } from "@/lib/money";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Transaction = {
    id: string;
    kind: "deposit" | "withdraw";
    amount: number;
    categoryId?: string | null;
    categoryName?: string | null;
    createdAt?: any;
};

type Category = {
    id: string;
    name: string;
    kind: "deposit" | "withdraw";
};

interface ChartProps {
    transactions: Transaction[];
    categories: Category[];
}

const COLORS = ["#00BCD4", "#4CAF50", "#FF9800", "#F44336", "#9C27B0", "#3F51B5"];

const toDate = (v: any): Date =>
    v?.toDate ? v.toDate() : v instanceof Date ? v : new Date();

export function MonthlyTrendChart({ transactions }: ChartProps) {
    const { t, language } = useLanguage();

    const data = useMemo(() => {
        const now = new Date();
        const months: { month: string; income: number; expense: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", { month: "short" });

            const monthTxs = transactions.filter((tx) => {
                const txDate = toDate(tx.createdAt);
                return (
                    txDate.getMonth() === date.getMonth() &&
                    txDate.getFullYear() === date.getFullYear()
                );
            });

            const income = monthTxs
                .filter((tx) => tx.kind === "deposit")
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const expense = monthTxs
                .filter((tx) => tx.kind === "withdraw")
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            months.push({ month: monthName, income, expense });
        }

        return months;
    }, [transactions, language]);

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">{t.dashboard.charts.monthlyTrend}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                    <XAxis dataKey="month" stroke="#A0A0A0" />
                    <YAxis stroke="#A0A0A0" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1E1E1E",
                            border: "1px solid #2C2C2C",
                            borderRadius: "8px",
                        }}
                        formatter={(value: number) => fmt(value, "TRY")}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#4CAF50"
                        strokeWidth={2}
                        name={t.dashboard.income}
                    />
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#F44336"
                        strokeWidth={2}
                        name={t.dashboard.expense}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function CategoryPieChart({ transactions, categories }: ChartProps) {
    const { t } = useLanguage();

    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        transactions
            .filter((tx) => tx.kind === "withdraw" && tx.categoryId)
            .forEach((tx) => {
                const catId = tx.categoryId!;
                categoryTotals[catId] = (categoryTotals[catId] || 0) + (tx.amount || 0);
            });

        return Object.entries(categoryTotals)
            .map(([catId, total]) => {
                const category = categories.find((c) => c.id === catId);
                return {
                    name: category?.name || t.dashboard.charts.other,
                    value: total,
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [transactions, categories, t]);

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-4">{t.dashboard.charts.categoryDistribution}</h3>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    {t.dashboard.charts.noCategoryExpenses}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">{t.dashboard.charts.categoryDistributionExpense}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) =>
                            `${name} (${((percent as number) * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1E1E1E",
                            border: "1px solid #2C2C2C",
                            borderRadius: "8px",
                        }}
                        formatter={(value: number) => fmt(value, "TRY")}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ComparisonBarChart({ transactions }: ChartProps) {
    const { t, language } = useLanguage();

    const data = useMemo(() => {
        const now = new Date();
        const months: { month: string; income: number; expense: number; net: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", { month: "short" });

            const monthTxs = transactions.filter((tx) => {
                const txDate = toDate(tx.createdAt);
                return (
                    txDate.getMonth() === date.getMonth() &&
                    txDate.getFullYear() === date.getFullYear()
                );
            });

            const income = monthTxs
                .filter((tx) => tx.kind === "deposit")
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const expense = monthTxs
                .filter((tx) => tx.kind === "withdraw")
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            months.push({ month: monthName, income, expense, net: income - expense });
        }

        return months;
    }, [transactions, language]);

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-4">{t.dashboard.charts.incomeExpenseComparison}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" />
                    <XAxis dataKey="month" stroke="##A0A0A0" />
                    <YAxis stroke="#A0A0A0" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1E1E1E",
                            border: "1px solid #2C2C2C",
                            borderRadius: "8px",
                        }}
                        formatter={(value: number) => fmt(value, "TRY")}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#4CAF50" name={t.dashboard.income} />
                    <Bar dataKey="expense" fill="#F44336" name={t.dashboard.expense} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
