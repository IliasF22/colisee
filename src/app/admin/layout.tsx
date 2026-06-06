"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

export const ADMIN_EMAIL = "thefrejman@gmail.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !allowed) {
      const t = setTimeout(() => router.replace("/"), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, allowed, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mt/50" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        <ShieldAlert className="mb-4 h-10 w-10 text-err" />
        <h1 className="text-xl font-bold">Accès réservé</h1>
        <p className="mt-1 text-sm text-mt">Cette section est réservée à l&apos;administrateur. Redirection…</p>
      </div>
    );
  }

  return <>{children}</>;
}
