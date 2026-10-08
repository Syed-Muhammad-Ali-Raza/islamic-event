"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = isAuthenticated && (!requireAdmin || user?.role === "ADMIN");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (requireAdmin && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isAuthenticated, user, requireAdmin, router, pathname]);

  if (!allowed) {
    return (
      <div className="container-page py-24 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
