"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { isSuperAdminRole } from "@/types";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** Super admins only (legacy ADMIN counts — same as the API). */
  requireSuperAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false, requireSuperAdmin = false }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  // Wait one client mount so zustand persist can hydrate from localStorage
  // before we decide to redirect (avoids false logout on hard refresh).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const adminOk = !requireAdmin || isSuperAdminRole(user?.role);
  const superAdminOk = !requireSuperAdmin || isSuperAdminRole(user?.role);
  const allowed = hydrated && isAuthenticated && adminOk && superAdminOk;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (!adminOk || !superAdminOk) {
      router.replace("/");
    }
  }, [hydrated, isAuthenticated, adminOk, superAdminOk, router, pathname]);

  if (!allowed) {
    return (
      <div className="container-page py-24 text-center">
        <div className="h-10 w-10 mx-auto mb-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
