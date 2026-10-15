"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  useAdminOrganizations,
  useCreateOrganization,
  useSetOrganizationActive,
  useUpdateOrganization,
} from "@/hooks/useOrganizations";
import { Input, Textarea } from "@/components/ui/FormField";
import type { CreateOrganizationInput } from "@/services/organization.service";

// ─── Super admin: organization management ────────────────────────────────────
// Create / edit / deactivate organizations and jump to member management.

interface OrgFormValues {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

const EMPTY_FORM: OrgFormValues = { name: "", description: "", phone: "", email: "", website: "", address: "" };

function toPayload(values: OrgFormValues): CreateOrganizationInput {
  const payload: CreateOrganizationInput = { name: values.name.trim() };
  const optional: (keyof OrgFormValues)[] = ["description", "phone", "email", "website", "address"];
  for (const key of optional) {
    const trimmed = values[key].trim();
    if (trimmed) payload[key] = trimmed;
  }
  return payload;
}

function OrgForm({
  initial,
  submitLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial: OrgFormValues;
  submitLabel: string;
  busy: boolean;
  error?: string;
  onSubmit: (values: OrgFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial);
  const set = (key: keyof OrgFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.name.trim()) return;
        onSubmit(values);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <Input
        id={`org-${initial.name || "new"}-name`}
        label={t("fields.name")}
        required
        value={values.name}
        onChange={set("name")}
      />
      <Input
        id={`org-${initial.name || "new"}-email`}
        label={t("fields.email")}
        type="email"
        value={values.email}
        onChange={set("email")}
      />
      <Input
        id={`org-${initial.name || "new"}-phone`}
        label={t("fields.phone")}
        value={values.phone}
        onChange={set("phone")}
      />
      <Input
        id={`org-${initial.name || "new"}-website`}
        label={t("fields.website")}
        value={values.website}
        onChange={set("website")}
      />
      <div className="sm:col-span-2">
        <Textarea
          id={`org-${initial.name || "new"}-address`}
          label={t("fields.address")}
          rows={2}
          value={values.address}
          onChange={set("address")}
        />
      </div>
      <div className="sm:col-span-2">
        <Textarea
          id={`org-${initial.name || "new"}-description`}
          label={t("fields.description")}
          rows={3}
          value={values.description}
          onChange={set("description")}
        />
      </div>
      {error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            {t("superAdmin.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

export default function SuperAdminOrgsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useAdminOrganizations(page, query);
  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const setActive = useSetOrganizationActive();

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/super-admin" className="text-xs text-slate-500 hover:text-slate-700">
            ← {t("superAdmin.back")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("superAdmin.orgsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("superAdmin.orgsSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {creating ? t("superAdmin.cancel") : `+ ${t("superAdmin.createOrg")}`}
        </button>
      </div>

      {creating && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <OrgForm
            initial={EMPTY_FORM}
            submitLabel={t("superAdmin.createOrg")}
            busy={create.isPending}
            error={create.isError ? t("superAdmin.saveError") : undefined}
            onSubmit={(values) =>
              create.mutate(toPayload(values), { onSuccess: () => setCreating(false) })
            }
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
          setPage(1);
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("superAdmin.searchOrgs")}
          className="input max-w-xs"
        />
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          {t("fields.search")}
        </button>
      </form>

      {list.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
        </div>
      ) : (list.data?.data.length ?? 0) === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          {query ? t("superAdmin.noResults") : t("superAdmin.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {list.data!.data.map((org) => (
            <li key={org.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{org.name}</span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        org.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {org.isActive ? t("superAdmin.active") : t("superAdmin.inactive")}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    /{org.slug}
                    {org.email ? ` · ${org.email}` : ""}
                    {org.phone ? ` · ${org.phone}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === org.id ? null : org.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    {editingId === org.id ? t("superAdmin.cancel") : t("superAdmin.edit")}
                  </button>
                  <Link
                    href={`/super-admin/orgs/${org.id}/members`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    {t("superAdmin.members")}
                  </Link>
                  <button
                    type="button"
                    disabled={setActive.isPending}
                    onClick={() => setActive.mutate({ id: org.id, isActive: !org.isActive })}
                    className={`rounded-lg border px-3 py-1.5 disabled:opacity-50 ${
                      org.isActive
                        ? "border-red-300 text-red-600 hover:bg-red-50"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {org.isActive ? t("superAdmin.deactivate") : t("superAdmin.activate")}
                  </button>
                </div>
              </div>

              {editingId === org.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <OrgForm
                    initial={{
                      name: org.name,
                      description: org.description ?? "",
                      phone: org.phone ?? "",
                      email: org.email ?? "",
                      website: org.website ?? "",
                      address: org.address ?? "",
                    }}
                    submitLabel={t("superAdmin.save")}
                    busy={update.isPending}
                    error={update.isError ? t("superAdmin.saveError") : undefined}
                    onSubmit={(values) =>
                      update.mutate(
                        { id: org.id, data: toPayload(values) },
                        { onSuccess: () => setEditingId(null) }
                      )
                    }
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {list.data && list.data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            {t("approvals.prev")}
          </button>
          <span className="text-slate-500">
            {t("approvals.pageOf", { page: list.data.pagination.page, total: list.data.pagination.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= list.data.pagination.totalPages}
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
