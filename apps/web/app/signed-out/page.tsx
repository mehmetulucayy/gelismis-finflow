export default function SignedOutPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#0b0b0b] text-white">
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-[#2C2C2C] bg-[#1E1E1E] p-8 text-center">
        <div className="mx-auto mb-4 size-12 rounded-xl grid place-items-center bg-[#00BCD4]/20 border border-[#00BCD4]/30">
          <span className="text-[#00BCD4] font-bold">✓</span>
        </div>
        <h1 className="text-xl font-semibold">Güvenle çıkış yaptın</h1>
        <p className="mt-1 text-sm text-[#A0A0A0]">
          Oturumun kapatıldı. İstediğin zaman yeniden giriş yapabilirsin.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <a
            href="/login"
            className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Giriş Yap
          </a>
          <a
            href="/"
            className="rounded-lg border border-[#2C2C2C] px-4 py-2 text-sm hover:bg-[#262626]"
          >
            Ana Sayfa
          </a>
        </div>
      </div>
    </div>
  );
}
