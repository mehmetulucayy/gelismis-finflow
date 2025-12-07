import React from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    color?: string;
    className?: string;
}

const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
};

export default function LoadingSpinner({
    size = "md",
    color = "#00BCD4",
    className = "",
}: LoadingSpinnerProps) {
    return (
        <div
            className={`${sizeClasses[size]} ${className} animate-spin rounded-full border-t-transparent`}
            style={{ borderColor: `${color} transparent ${color} ${color}` }}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

export function LoadingOverlay({ message }: { message?: string }) {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="rounded-xl bg-card border border-border p-6 shadow-xl">
                <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-muted-foreground">{message || t.common.loading}</p>
                </div>
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
            <div className="h-4 bg-[#2C2C2C] rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-[#2C2C2C] rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-[#2C2C2C] rounded w-1/2"></div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border animate-pulse">
                <div className="h-4 bg-[#2C2C2C] rounded w-1/4"></div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-border animate-pulse">
                    <div className="flex gap-4">
                        <div className="h-4 bg-[#2C2C2C] rounded w-1/4"></div>
                        <div className="h-4 bg-[#2C2C2C] rounded w-1/3"></div>
                        <div className="h-4 bg-[#2C2C2C] rounded w-1/6"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
