"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Loading görünümü
  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <svg
            className="size-5 animate-spin text-[#00BCD4]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          Yükleniyor…
        </div>
      </div>
    );
  }

  // Yetkisiz görünüm
  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white">
        <div className="w-[520px] max-w-[92vw] rounded-2xl border border-border bg-card p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-4 size-12 rounded-xl grid place-items-center bg-[#00BCD4]/20 border border-[#00BCD4]/30">
            <span className="text-[#00BCD4] font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold">Erişim için giriş yap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Oturumun yok ya da süresi dolmuş. Devam etmek için giriş yapmalısın.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              href="/login"
              className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Giriş Yap
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-card/80"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Yetkili -> içeriği göster
  return <>{children}</>;
}
