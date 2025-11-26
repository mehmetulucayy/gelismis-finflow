"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { collection, getDocs, query } from "firebase/firestore";
import { useState } from "react";

export default function DataManagementPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [exporting, setExporting] = useState(false);

    const exportData = async () => {
        if (!user) return;

        setExporting(true);

        try {
            // Fetch all user data
            const collections = [
                "accounts",
                "transactions",
                "budgets",
                "categories",
                "settings",
            ];

            const data: any = {};

            for (const collName of collections) {
                const q = query(collection(db, "users", user.uid, collName));
                const snap = await getDocs(q);
                data[collName] = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
            }

            // Create JSON file
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `finflow-backup-${new Date().toISOString().split("T")[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            alert("Dışa aktarma sırasında hata oluştu.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t.data.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {t.data.subtitle}
                </p>
            </div>

            {/* Export */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3">{t.common.export}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {t.data.exportJSONDesc}
                </p>
                <button
                    onClick={exportData}
                    disabled={exporting}
                    className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                    {exporting ? t.common.loading : `📥 ${t.data.exportJSON}`}
                </button>
            </div>



            {/* Clear Data */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                <h3 className="font-semibold text-red-400 mb-3">{t.data.dangerZone}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {t.data.clearDataDesc}
                </p>
                <button
                    disabled
                    className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-2 text-sm opacity-50 cursor-not-allowed"
                >
                    🗑️ {t.data.clearData}
                </button>
            </div>

            {/* Info */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3">💡 {t.settings.appInfo}</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• {t.data.exportJSONDesc}</li>
                </ul>
            </div>
        </div>
    );
}
