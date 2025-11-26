import React from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
            {icon && (
                <div className="mb-4 flex justify-center text-muted-foreground opacity-50">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm hover:opacity-90 transition-opacity"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Predefined empty states for common scenarios
export function NoAccountsEmpty({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();

    return (
        <EmptyState
            icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7H3V5h14l4 2zM3 8h18v11H3V8zm12 3a2 2 0 100 4h4v-4h-4z" />
                </svg>
            }
            title={t.ui.emptyStates.noAccounts.title}
            description={t.ui.emptyStates.noAccounts.description}
            action={{ label: t.ui.emptyStates.noAccounts.action, onClick: onAdd }}
        />
    );
}

export function NoTransactionsEmpty({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();

    return (
        <EmptyState
            icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h10l-3-3h2l4 4-4 4h-2l3-3H7V7zm10 10H7l3 3H8l-4-4 4-4h2l-3 3h10v2z" />
                </svg>
            }
            title={t.ui.emptyStates.noTransactions.title}
            description={t.ui.emptyStates.noTransactions.description}
            action={{ label: t.ui.emptyStates.noTransactions.action, onClick: onAdd }}
        />
    );
}

export function NoBudgetsEmpty({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();

    return (
        <EmptyState
            icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm4 2v4h4v-4H7z" />
                </svg>
            }
            title={t.ui.emptyStates.noBudgets.title}
            description={t.ui.emptyStates.noBudgets.description}
            action={{ label: t.ui.emptyStates.noBudgets.action, onClick: onAdd }}
        />
    );
}

export function NoDataEmpty() {
    const { t } = useLanguage();

    return (
        <EmptyState
            icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            }
            title={t.ui.emptyStates.noData.title}
            description={t.ui.emptyStates.noData.description}
        />
    );
}
