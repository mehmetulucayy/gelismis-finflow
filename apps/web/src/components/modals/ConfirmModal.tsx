"use client";
export default function ConfirmModal({
  open, onClose, title = "Emin misiniz?", desc, confirmText = "Evet", onConfirm
}: {
  open: boolean; onClose: () => void; title?: string; desc?: string;
  confirmText?: string; onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="w-[420px] max-w-[92vw] rounded-2xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-1">{title}</div>
        {desc && <p className="text-sm text-muted-foreground mb-4">{desc}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">İptal</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500/90 text-white px-3 py-2 text-sm">Sil</button>
        </div>
      </div>
    </div>
  );
}
