import "../globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main className="min-h-dvh grid place-items-center p-6">{children}</main>
    </AuthProvider>
  );
}
