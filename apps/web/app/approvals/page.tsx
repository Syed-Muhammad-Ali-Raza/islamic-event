"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApprovalQueue } from "@/components/approvals/ApprovalQueue";
import type { ApprovalStatusFilter, DirectoryModuleKey } from "@/types";

function ApprovalsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const status = searchParams.get("status");
  const moduleFilter = searchParams.get("module");
  const mine = searchParams.get("mine") === "true";

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {mine ? t("approvals.mineTitle") : t("approvals.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mine ? t("approvals.mineSubtitle") : t("approvals.subtitle")}
        </p>
      </div>

      {/* Filters come from the URL (notifications deep-link here); the queue
          itself owns the interactive filter state after mount. */}
      <ApprovalQueue
        key={`${mine}-${status ?? ""}-${moduleFilter ?? ""}`}
        mine={mine}
        showScopeToggle={false}
        initialStatus={(status as ApprovalStatusFilter) || undefined}
        initialModule={(moduleFilter as DirectoryModuleKey) || undefined}
      />
    </div>
  );
}

export default function ApprovalsPage() {
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
        <ApprovalsContent />
      </Suspense>
    </AuthGuard>
  );
}
