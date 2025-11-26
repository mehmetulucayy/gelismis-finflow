"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { auth } from "@/lib/firebase.client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

type SettingItem = {
    href: string;
    label: string;
    description: string;
    icon: string;
};

export default function SettingsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();

    const settings: SettingItem[] = [
        {
            href: "/settings/profile",
            label: t.settings.profile,
            description: t.settings.profileDesc,
            icon: "👤",
        },
        {
            href: "/settings/categories",
            label: t.settings.categories,
            description: t.settings.categoriesDesc,
            icon: "🏷️",
        },
        {
            href: "/settings/currency",
            label: t.settings.currency,
            description: t.settings.currencyDesc,
            icon: "💱",
        },
        {
            href: "/settings/preferences",
            label: t.settings.preferences,
            description: t.settings.preferencesDesc,
            icon: "⚙️",
        },
        {
            href: "/settings/data",
            label: t.settings.dataManagement,
            description: t.settings.dataManagementDesc,
            icon: "📦",
        },
    ];

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/signed-out");
    };

    // If we're on a sub-page, don't render the main settings page
    if (pathname !== "/settings") {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-semibold">{t.settings.title}</h1>
                <p className="text-sm text-muted-foreground">
                    {t.settings.subtitle}
                </p>
            </header>

            {/* User Info Card */}
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#00BCD4]/20 border-2 border-[#00BCD4] flex items-center justify-center text-2xl">
                            {user?.email?.[0].toUpperCase() || "?"}
                        </div>
                        <div>
                            <div className="font-semibold text-lg">
                                {user?.displayName || "Kullanıcı"}
                            </div>
                            <div className="text-sm text-muted-foreground">{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-2 text-sm hover:bg-red-500/20 transition-colors"
                    >
                        {t.common.signOut}
                    </button>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group rounded-xl border border-border bg-card p-5 hover:border-[#00BCD4]/30 hover:bg-card/80 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">{item.icon}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1 group-hover:text-[#00BCD4] transition-colors">
                                    {item.label}
                                </h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <svg
                                className="w-5 h-5 text-muted-foreground group-hover:text-[#00BCD4] transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>

            {/* App Info */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3">{t.settings.appInfo}</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.settings.version}</span>
                        <span>1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.settings.lastUpdate}</span>
                        <span>{new Date().toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.settings.framework}</span>
                        <span>Next.js 16</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
