"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useApprovalQueue, useApproveSubmission, useRejectSubmission } from "@/hooks/useApprovals";
import { useMyMemberships } from "@/hooks/useOrganizations";
import { MODULE_HREF } from "@/services/approval.service";
import { useAuthStore } from "@/stores/auth.store";
import { isSuperAdminRole } from "@/types";
import type {
  ApprovalStatusFilter,
  DirectoryModuleKey,
  DirectorySubmission,
  MyOrganizationMembership,
} from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

const MODULE_KEYS: DirectoryModuleKey[] = [
  "dastarkhwan", "imambargah", "place", "darbar",
  "ursDate", "procession", "charity", "mela", "scholar",
];

const STATUS_FILTERS: ApprovalStatusFilter[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];

interface Props {
  /** True → only my own submissions; false → my review scope (org queue). */
  mine?: boolean;
  /** Super admins may switch between "everything" and "mine". */
  showScopeToggle?: boolean;
  /** Initial filters (e.g. from notification deep links). */
  initialStatus?: ApprovalStatusFilter;
  initialModule?: DirectoryModuleKey;
}

export function ApprovalQueue({
  mine = false,
  showScopeToggle = false,
  initialStatus,
  initialModule,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const superAdmin = isSuperAdminRole(user?.role);
  const { data: memberships } = useMyMemberships();

  const [scopeMine, setScopeMine] = useState(mine);
  const [status, setStatus] = useState<ApprovalStatusFilter>(initialStatus ?? "PENDING");
  const [module, setModule] = useState<DirectoryModuleKey | "">(initialModule ?? "");
  const [page, setPage] = useState(1);

  const queue = useApprovalQueue({ mine: scopeMine, status, module: module || undefined, page });
  const approve = useApproveSubmission();
  const reject = useRejectSubmission();

  // Org OWNER/ADMIN can decide rows of their orgs; super admin can decide all.
  const canDecide = (row: DirectorySubmission) => {
    if (superAdmin) return true;
    if (!row.organizerId || !memberships) return false;
    return memberships.some(
      (m: MyOrganizationMembership) =>
        m.organizerId === row.organizerId && (m.role === "OWNER" || m.role === "ADMIN")
    );
  };

  const rows = queue.data?.data ?? [];
  const pagination = queue.data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {showScopeToggle && (
          <div className="flex overflow-hidden rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => { setScopeMine(false); setPage(1); }}
              className={`px-3 py-2 text-sm ${!scopeMine ? "bg-brand-600 text-white" : "bg-white text-slate-600"}`}
            >
              {t("approvals.scopeQueue")}
            </button>
            <button
              type="button"
              onClick={() => { setScopeMine(true); setPage(1); }}
              className={`px-3 py-2 text-sm ${scopeMine ? "bg-brand-600 text-white" : "bg-white text-slate-600"}`}
            >
              {t("approvals.scopeMine")}
            </button>
          </div>
        )}

        <label className="flex flex-col text-xs text-slate-500">
          {t("approvals.status")}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as ApprovalStatusFilter); setPage(1); }}
            className="input mt-1 w-40"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? t("approvals.statusAll") : t(`approvals.status_${s}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs text-slate-500">
          {t("approvals.module")}
          <select
            value={module}
            onChange={(e) => { setModule(e.target.value as DirectoryModuleKey | ""); setPage(1); }}
            className="input mt-1 w-48"
          >
            <option value="">{t("approvals.allModules")}</option>
            {MODULE_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(`approvals.module_${k}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Rows */}
      {queue.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {scopeMine ? t("approvals.emptyMine") : t("approvals.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rows.map((row) => (
            <li key={`${row.module}-${row.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {t(`approvals.module_${row.module}`)}
                  </span>
                  <Link
                    href={MODULE_HREF[row.module]}
                    className="truncate text-sm font-medium text-slate-800 hover:text-brand-600"
                  >
                    {row.name}
                  </Link>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("approvals.submittedOn", { date: new Date(row.createdAt).toLocaleDateString() })}
                  {row.rejectionReason ? ` — ${row.rejectionReason}` : ""}
                </p>
              </div>

              <StatusBadge
                status={row.approvalStatus}
                label={t(`approvals.status_${row.approvalStatus}`)}
              />

              {canDecide(row) && (
                <div className="flex gap-2">
                  {row.approvalStatus !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ module: row.module, id: row.id })}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {t("approvals.approve")}
                    </button>
                  )}
                  {row.approvalStatus !== "REJECTED" && (
                    <RejectButton
                      onReject={(reason) => reject.mutate({ module: row.module, id: row.id, reason })}
                      busy={reject.isPending}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            {t("approvals.prev")}
          </button>
          <span className="text-slate-500">
            {t("approvals.pageOf", { page: pagination.page, total: pagination.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            {t("approvals.next")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Inline reject with optional reason ──────────────────────────────────────

function RejectButton({
  onReject,
  busy,
}: {
  onReject: (reason?: string) => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        {t("approvals.reject")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("approvals.rejectReason")}
        className="input h-8 w-56 text-xs"
      />
      <button
        type="button"
        disabled={busy || (reason.trim().length > 0 && reason.trim().length < 3)}
        onClick={() => { onReject(reason.trim() || undefined); setOpen(false); setReason(""); }}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? "…" : t("approvals.confirmReject")}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setReason(""); }}
        className="text-xs text-slate-500 hover:text-slate-700"
      >
        {t("approvals.cancel")}
      </button>
    </div>
  );
}
