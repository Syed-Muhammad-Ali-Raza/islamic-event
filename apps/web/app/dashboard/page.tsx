"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApprovalQueue } from "@/components/approvals/ApprovalQueue";
import { SubmitDirectoryForm } from "@/components/dashboard/SubmitDirectoryForm";
import { useMyMemberships } from "@/hooks/useOrganizations";
import { useAuthStore } from "@/stores/auth.store";
import { isSuperAdminRole } from "@/types";
import type { DirectoryModuleKey, MyOrganizationMembership, OrgRole } from "@/types";

const MODULE_KEYS: DirectoryModuleKey[] = [
  "dastarkhwan", "imambargah", "place", "darbar",
  "ursDate", "procession", "charity", "mela", "scholar",
];

function RoleBadge({ role }: { role: OrgRole }) {
  const colors: Record<OrgRole, string> = {
    OWNER: "bg-purple-50 text-purple-700 border-purple-200",
    ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
    EDITOR: "bg-slate-100 text-slate-600 border-slate-300",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${colors[role]}`}>
      {role}
    </span>
  );
}

function DashboardContent() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const superAdmin = isSuperAdminRole(user?.role);
  const { data: memberships, isPending } = useMyMemberships();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "submit" ? "submit" : "submissions";
  const initialModule = searchParams.get("module");
  const [tab, setTab] = useState<"submissions" | "submit">(initialTab);

  const canReview =
    superAdmin ||
    (memberships ?? []).some(
      (m: MyOrganizationMembership) => m.role === "OWNER" || m.role === "ADMIN"
    );

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.subtitle")}</p>
        </div>
        {canReview && (
          <Link
            href="/approvals"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("dashboard.reviewQueue")}
          </Link>
        )}
      </div>

      {/* Memberships */}
      <div className="mb-8">
        {isPending ? (
          <div className="skeleton h-16 w-full rounded-xl" />
        ) : (memberships?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
            {superAdmin ? (
              <Link href="/super-admin/orgs" className="text-brand-600 hover:underline">
                {t("dashboard.noMembershipsAdmin")}
              </Link>
            ) : (
              t("dashboard.noMemberships")
            )}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {memberships!.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
              >
                <span className="text-sm font-medium text-slate-800">{m.organizer.name}</span>
                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(["submissions", "submit"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "step" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {key === "submissions" ? t("dashboard.tabSubmissions") : t("dashboard.tabSubmit")}
          </button>
        ))}
      </div>

      {tab === "submissions" ? (
        <ApprovalQueue mine showScopeToggle={false} />
      ) : (
        <SubmitDirectoryForm
          initialModule={
            initialModule && MODULE_KEYS.includes(initialModule as DirectoryModuleKey)
              ? (initialModule as DirectoryModuleKey)
              : undefined
          }
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="container-page py-10">
            <div className="skeleton h-8 w-48 mb-6" />
            <div className="skeleton h-64 w-full rounded-2xl" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  );
}
