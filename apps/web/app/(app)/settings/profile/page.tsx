"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { db } from "@/lib/firebase.client";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";

export default function ProfilePage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        setSuccess(false);

        try {
            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: displayName.trim() || null,
            });

            // Optionally save to Firestore
            await setDoc(
                doc(db, "users", user.uid, "settings", "profile"),
                {
                    displayName: displayName.trim(),
                    updatedAt: new Date(),
                },
                { merge: true }
            );

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Profile update error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6 text-center text-muted-foreground">{t.common.loading}</div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t.profile.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {t.profile.subtitle}
                </p>
            </div>

            {/* Profile Form */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                {/* Email (read-only) */}
                <div>
                    <label className="text-xs text-muted-foreground">{t.profile.email}</label>
                    <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm opacity-60 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                        {t.profile.emailNote}
                    </p>
                </div>

                {/* Display Name */}
                <div>
                    <label className="text-xs text-muted-foreground">{t.profile.displayName}</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm"
                    />
                </div>

                {/* User ID (read-only) */}
                <div>
                    <label className="text-xs text-muted-foreground">{t.profile.userId}</label>
                    <input
                        type="text"
                        value={user.uid}
                        disabled
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm opacity-60 cursor-not-allowed font-mono text-xs"
                    />
                </div>

                {/* Account Created */}
                <div>
                    <label className="text-xs text-muted-foreground">{t.profile.accountCreated}</label>
                    <input
                        type="text"
                        value={
                            user.metadata.creationTime
                                ? new Date(user.metadata.creationTime).toLocaleDateString(
                                    language === "tr" ? "tr-TR" : "en-US",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }
                                )
                                : "-"
                        }
                        disabled
                        className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm opacity-60 cursor-not-allowed"
                    />
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-2">
                    {success && (
                        <span className="text-sm text-emerald-400">✓ {t.profile.saved}</span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="ml-auto rounded-lg bg-[#00BCD4] text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? t.profile.saving : t.common.save}
                    </button>
                </div>
            </div>

            {/* Security Section */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3">{t.profile.security}</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">{t.profile.changePassword}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.profile.changePasswordDesc}
                            </div>
                        </div>
                        <button className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card/80">
                            {t.common.change}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">{t.profile.twoFactor}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.profile.twoFactorDesc}
                            </div>
                        </div>
                        <button className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card/80">
                            {t.profile.comingSoon}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                <h3 className="font-semibold text-red-400 mb-3">{t.profile.dangerZone}</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium">{t.profile.deleteAccount}</div>
                            <div className="text-xs text-muted-foreground">
                                {t.profile.deleteAccountDesc}
                            </div>
                        </div>
                        <button className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-3 py-1.5 text-sm hover:bg-red-500/20">
                            {t.profile.deleteAccount}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
