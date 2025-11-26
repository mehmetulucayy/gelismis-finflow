import "../globals.css";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/guards/AuthGuard";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ToastContainer } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppHeader />
        <AuthGuard>
          <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
            <Sidebar />
            <main className="flex-1 bg-card rounded-xl p-6 shadow-lg border border-border min-h-[70vh]">
              {children}
            </main>
          </div>
        </AuthGuard>
        <ToastContainer />
      </LanguageProvider>
    </AuthProvider>
  );
}
