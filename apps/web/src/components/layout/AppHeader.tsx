"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function AppHeader() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/signed-out");
    } catch {
      router.replace("/login");
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "tr" ? "en" : "tr");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="size-6 grid place-items-center rounded-md bg-[#00BCD4]/20 border border-[#00BCD4]/30">
            <span className="text-[#00BCD4] font-bold">F</span>
          </div>
          <span className="text-sm font-semibold text-foreground">FinFlow</span>
        </a>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden md:block text-xs text-muted-foreground">
              {user.displayName ?? user.email}
            </span>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-card transition-colors flex items-center gap-1.5"
            title={language === "tr" ? "Switch to English" : "Türkçe'ye geç"}
          >
            <span className="text-base">{language === "tr" ? "🇹🇷" : "🇬🇧"}</span>
            <span className="uppercase">{language}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-md bg-[#00BCD4] text-black px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            {t.common.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}
