"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

type Preferences = {
    theme: "light" | "dark" | "system";
    dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    currency: "TRY" | "USD" | "EUR";
    notifications: {
        budgetAlerts: boolean;
        monthlyReports: boolean;
        transactionReminders: boolean;
    };
};

const DEFAULT_PREFS: Preferences = {
    theme: "dark",
    dateFormat: "DD/MM/YYYY",
    currency: "TRY",
    notifications: {
        budgetAlerts: true,
        monthlyReports: false,
        transactionReminders: false,
    },
};

export default function PreferencesPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        const ref = doc(db, "users", user.uid, "settings", "preferences");
        return onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const data = snap.data() as Preferences;
                setPrefs({ ...DEFAULT_PREFS, ...data });

                // Sync theme from Firestore on initial load
                if (data.theme) {
                    if (data.theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            }
            setLoading(false);
        });
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await setDoc(
                doc(db, "users", user.uid, "settings", "preferences"),
                prefs,
                { merge: true }
            );
            setTimeout(() => setSaving(false), 1000);
        } catch (error) {
            console.error("Save error:", error);
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-muted-foreground">{t.common.loading}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t.preferences.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {t.preferences.subtitle}
                </p>
            </div>

            {/* Appearance */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold">{t.preferences.appearance}</h3>

                <div>
                    <label className="text-xs text-muted-foreground">{t.preferences.theme}</label>
                    <select
                        value={prefs.theme}
                        onChange={async (e) => {
                            const newTheme = e.target.value as any;
                            const newPrefs = { ...prefs, theme: newTheme };
                            setPrefs(newPrefs);

                            // Apply theme immediately
                            if (newTheme === 'dark') {
                                document.documentElement.classList.add('dark');
                            } else {
                                document.documentElement.classList.remove('dark');
                            }

                            // Save to Firestore immediately
                            if (user) {
                                try {
                                    await setDoc(
                                        doc(db, "users", user.uid, "settings", "preferences"),
                                        newPrefs,
                                        { merge: true }
                                    );
                                } catch (error) {
                                    console.error("Theme save error:", error);
                                }
                            }
                        }}
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    >
                        <option value="light">{t.preferences.light}</option>
                        <option value="dark">{t.preferences.dark}</option>
                        <option value="system">{t.preferences.system}</option>
                    </select>

                </div>
            </div>

            {/* Formatting */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold">{t.preferences.formatting}</h3>

                <div>
                    <label className="text-xs text-muted-foreground">{t.preferences.dateFormat}</label>
                    <select
                        value={prefs.dateFormat}
                        onChange={(e) =>
                            setPrefs({ ...prefs, dateFormat: e.target.value as any })
                        }
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    >
                        <option value="DD/MM/YYYY">GG/AA/YYYY (25/11/2025)</option>
                        <option value="MM/DD/YYYY">AA/GG/YYYY (11/25/2025)</option>
                        <option value="YYYY-MM-DD">YYYY-AA-GG (2025-11-25)</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-muted-foreground">{t.preferences.defaultCurrency}</label>
                    <select
                        value={prefs.currency}
                        onChange={(e) =>
                            setPrefs({ ...prefs, currency: e.target.value as any })
                        }
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    >
                        <option value="TRY">TRY (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold">{t.preferences.notifications}</h3>

                <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <div className="text-sm font-medium">{t.preferences.budgetAlerts}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.preferences.budgetAlerts}
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.notifications.budgetAlerts}
                            onChange={(e) =>
                                setPrefs({
                                    ...prefs,
                                    notifications: {
                                        ...prefs.notifications,
                                        budgetAlerts: e.target.checked,
                                    },
                                })
                            }
                            className="w-5 h-5 rounded border-border bg-input checked:bg-[#00BCD4]"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <div className="text-sm font-medium">{t.preferences.monthlyReport}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.preferences.monthlyReport}
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.notifications.monthlyReports}
                            onChange={(e) =>
                                setPrefs({
                                    ...prefs,
                                    notifications: {
                                        ...prefs.notifications,
                                        monthlyReports: e.target.checked,
                                    },
                                })
                            }
                            className="w-5 h-5 rounded border-border bg-input checked:bg-[#00BCD4]"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <div className="text-sm font-medium">{t.preferences.pushNotifications}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.preferences.pushNotifications}
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.notifications.transactionReminders}
                            onChange={(e) =>
                                setPrefs({
                                    ...prefs,
                                    notifications: {
                                        ...prefs.notifications,
                                        transactionReminders: e.target.checked,
                                    },
                                })
                            }
                            className="w-5 h-5 rounded border-border bg-input checked:bg-[#00BCD4]"
                        />
                    </label>
                </div>

                <p className="text-[11px] text-muted-foreground">
                    {t.profile.comingSoon}
                </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? t.profile.saving : t.common.save}
                </button>
            </div>
        </div>
    );
}
