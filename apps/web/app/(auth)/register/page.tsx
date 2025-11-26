"use client";

import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase.client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const register = async () => {
    try {
      setErr(null); setInfo(null);

      if (name.trim().length < 2) return setErr("İsim en az 2 karakter olmalı.");
      if (!email.includes("@")) return setErr("Geçerli bir e-posta girin.");
      if (pw.length < 8) return setErr("Şifre en az 8 karakter olmalı.");
      if (pw !== pw2) return setErr("Şifreler eşleşmiyor.");

      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);

      // Profil adı
      await updateProfile(cred.user, { displayName: name.trim() });

      // Kullanıcı dökümanı (opsiyonel ama faydalı)
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      // E-posta doğrulaması
      await sendEmailVerification(cred.user);
      setInfo("Hesap oluşturuldu. E-posta doğrulama bağlantısı gönderildi!");
    } catch (e: any) {
      const code = String(e?.code ?? "");
      if (code.includes("email-already-in-use")) setErr("Bu e-posta zaten kayıtlı.");
      else if (code.includes("invalid-email")) setErr("E-posta adresi geçersiz.");
      else setErr("Kayıt başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
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
          <div className="p-6 space-y-3">
            <div className="text-lg font-semibold">Kaydol</div>

            <div>
              <label className="text-xs text-[#A0A0A0]">İsim</label>
              <input
                className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0]">E-posta</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#A0A0A0]">Şifre</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="En az 8 karakter"
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0]">Şifre (tekrar)</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg bg-[#121212] border border-[#2C2C2C] px-3 py-2 text-sm"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Tekrar şifre"
                />
              </div>
            </div>

            <button
              onClick={register}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#00BCD4] px-4 py-3 text-black font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Oluşturuluyor…" : "Hesap Oluştur"}
            </button>

            {err && <div className="text-xs text-[#F44336]">{err}</div>}
            {info && <div className="text-xs text-[#4CAF50]">{info}</div>}

            <div className="pt-2 text-xs text-[#9a9a9a]">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="text-[#00BCD4] hover:underline">
                Giriş Yap
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
