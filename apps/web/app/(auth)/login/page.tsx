"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const loginEmail = async () => {
    try {
      setErr(null); setInfo(null); setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      // AuthProvider state güncelleyecek, router replace tetiklenir
    } catch (e: any) {
      const code = String(e?.code ?? "");
      if (code.includes("user-not-found")) setErr("Böyle bir kullanıcı yok.");
      else if (code.includes("wrong-password")) setErr("Şifre hatalı.");
      else if (code.includes("invalid-email")) setErr("E-posta adresi geçersiz.");
      else setErr("Giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    try {
      setErr(null); setInfo(null); setLoading(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      setErr("Google ile giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const resetPw = async () => {
    try {
      setErr(null); setInfo(null);
      if (!email) return setErr("Şifre sıfırlamak için e-posta girin.");
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
    } catch (e: any) {
      setErr("Şifre sıfırlama gönderilemedi.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_10%,#0f172a_0%,#0b0b0b_40%,#0a0a0a_100%)] text-white">
      <div className="mx-auto max-w-[420px] px-4 pt-24">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="size-8 grid place-items-center rounded-xl bg-[#00BCD4]/20 border border-[#00BCD4]/30">
            <span className="text-[#00BCD4] font-bold">F</span>
          </div>
          <div className="text-xl font-semibold tracking-tight">FinFlow</div>
        </div>

        <div className="rounded-2xl border border-[#2C2C2C] bg-[#1E1E1E]/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="p-6 space-y-4">
            <div className="text-lg font-semibold">Giriş Yap</div>

            {/* Email & Password */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#A0A0A0]">E-posta</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0]">Şifre</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder=""
                />
              </div>

              <button
                onClick={loginEmail}
                disabled={loading}
                className="w-full rounded-xl bg-[#00BCD4] px-4 py-3 text-black font-medium hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>

              <button
                onClick={resetPw}
                className="w-full text-xs text-[#A0A0A0] hover:underline"
              >
                Şifremi unuttum
              </button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#2C2C2C]" />
              <span className="relative mx-auto block w-fit px-3 text-[11px] text-[#8b8b8b] bg-[#1E1E1E]">
                veya
              </span>
            </div>

            {/* Google */}
            <button
              onClick={loginGoogle}
              disabled={loading}
              className="w-full rounded-xl border border-[#2C2C2C] bg-[#121212] px-4 py-3 text-sm hover:bg-[#171717] disabled:opacity-60"
            >
              Google ile giriş yap
            </button>

            {err && <div className="text-xs text-[#F44336]">{err}</div>}
            {info && <div className="text-xs text-[#4CAF50]">{info}</div>}

            <div className="pt-2 text-xs text-[#9a9a9a]">
              Hesabın yok mu?{" "}
              <Link href="/register" className="text-[#00BCD4] hover:underline">
                Kaydol
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#9a9a9a]">
          Geri dönmek ister misin?{" "}
          <a href="/" className="text-[#00BCD4] hover:underline">Ana sayfa</a>
        </div>
      </div>
    </div>
  );
}
