"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  useAddOrgMember,
  useOrgMembers,
  useRemoveOrgMember,
  useUpdateOrgMemberRole,
} from "@/hooks/useOrganizations";
import { Input, Select } from "@/components/ui/FormField";
import type { OrgRole } from "@/types";

// ─── Super admin: members of one organization ────────────────────────────────

const ROLES: OrgRole[] = ["OWNER", "ADMIN", "EDITOR"];

export default function SuperAdminOrgMembersPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const orgId = params.id;

  const members = useOrgMembers(orgId);
  const add = useAddOrgMember(orgId);
  const updateRole = useUpdateOrgMemberRole(orgId);
  const remove = useRemoveOrgMember(orgId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("EDITOR");

  return (
    <div className="container-page py-10">
      <Link href="/super-admin/orgs" className="text-xs text-slate-500 hover:text-slate-700">
        ← {t("superAdmin.backToOrgs")}
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("superAdmin.membersTitle")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("superAdmin.membersSubtitle")}</p>

      {/* Add member */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = email.trim();
          if (!trimmed) return;
          add.mutate(
            { email: trimmed, role },
            { onSuccess: () => setEmail("") }
          );
        }}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="w-72">
          <Input
            id="member-email"
            label={t("superAdmin.memberEmail")}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={add.isError ? t("superAdmin.addMemberError") : undefined}
          />
        </div>
        <div className="w-40">
          <Select
            id="member-role"
            label={t("superAdmin.role")}
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <button
          type="submit"
          disabled={add.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {add.isPending ? "…" : `+ ${t("superAdmin.addMember")}`}
        </button>
      </form>

      {/* Members list */}
      <div className="mt-6">
        {members.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : (members.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            {t("superAdmin.noMembers")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {members.data!.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{member.user.name}</p>
                  <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                </div>

                <select
                  value={member.role}
                  onChange={(e) =>
                    updateRole.mutate({ userId: member.userId, role: e.target.value as OrgRole })
                  }
                  disabled={updateRole.isPending}
                  className="input w-32 text-sm"
                  aria-label={t("superAdmin.role")}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(t("superAdmin.removeConfirm"))) {
                      remove.mutate(member.userId);
                    }
                  }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("superAdmin.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
        {remove.isError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {t("superAdmin.removeError")}
          </p>
        )}
      </div>
    </div>
  );
}
