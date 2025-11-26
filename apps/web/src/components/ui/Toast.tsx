"use client";

import { create } from "zustand";
import { useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-dismiss after duration
        if (toast.duration !== 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, toast.duration || 3000);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

// Hook for easy toast usage
export function useToast() {
    const addToast = useToastStore((state) => state.addToast);

    return {
        success: (message: string, duration?: number) =>
            addToast({ type: "success", message, duration }),
        error: (message: string, duration?: number) =>
            addToast({ type: "error", message, duration }),
        warning: (message: string, duration?: number) =>
            addToast({ type: "warning", message, duration }),
        info: (message: string, duration?: number) =>
            addToast({ type: "info", message, duration }),
    };
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        icon: "✓",
    },
    error: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "✕",
    },
    warning: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        icon: "⚠",
    },
    info: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: "ℹ",
    },
};

export function ToastContainer() {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => {
                const styles = typeStyles[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`${styles.bg} ${styles.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right duration-300`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">{styles.icon}</span>
                            <p className="flex-1 text-sm">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-muted-foreground hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
