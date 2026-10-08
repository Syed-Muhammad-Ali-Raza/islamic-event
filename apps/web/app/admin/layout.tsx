import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const metadata: Metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <div className="container-page py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-white/50 text-sm">Moderate events, manage users and reports</p>
        </div>

        <div className="mb-6 border-b border-white/10 pb-3">
          <AdminTabs />
        </div>

        {children}
      </div>
    </AuthGuard>
  );
}
