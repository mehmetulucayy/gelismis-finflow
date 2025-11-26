"use client";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase.client";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { fmt } from "@/lib/money";

const schema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter"),
  type: z.enum(["checking", "savings", "credit", "cash"]),
  currency: z.enum(["TRY", "USD", "EUR"]),
  balance: z.coerce.number().min(0, "Negatif olamaz")
});
type FormData = z.infer<typeof schema>;

export default function AccountFormModal({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ name: "", type: "checking", currency: "TRY", balance: 0 });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      const data = schema.parse(form);
      if (!user) { setErr("Oturum yok"); return; }
      setLoading(true);
      await addDoc(collection(db, "users", user.uid, "accounts"), {
        ...data,
        createdAt: serverTimestamp()
      });
      setLoading(false);
      setOpen(false);
      onCreated?.();
      setForm({ name: "", type: "checking", currency: "TRY", balance: 0 });
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90">
        + Hesap Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
          <div className="w-[420px] rounded-xl bg-card border border-border p-5 shadow-xl">
            <div className="text-lg font-semibold mb-3">Yeni Hesap</div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Ad</label>
                <input
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn. Ziraat Vadesiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tür</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as FormData["type"] })}
                  >
                    <option value="checking">Vadesiz</option>
                    <option value="savings">Vadeli</option>
                    <option value="credit">Kredi Kartı</option>
                    <option value="cash">Nakit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Para Birimi</label>
                  <select
                    className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as FormData["currency"] })}
                  >
                    <option>TRY</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Başlangıç Bakiye</label>
                <input
                  type="number" min={0} step="0.01"
                  className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.valueAsNumber })}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Önizleme: {fmt(Number(form.balance || 0), form.currency)}
                </div>
              </div>

              {err && <div className="text-xs text-[#F44336]">{err}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/80">İptal</button>
                <button disabled={loading} onClick={submit}
                  className="rounded-lg bg-[#00BCD4] text-black px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50">
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
