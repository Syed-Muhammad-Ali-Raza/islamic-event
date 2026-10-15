"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubmitDirectory } from "@/hooks/useApprovals";
import { useMyMemberships } from "@/hooks/useOrganizations";
import {
  MODULE_FIELDS,
  buildSubmissionPayload,
  humanizeFieldName,
} from "@/lib/directory-forms";
import { MODULE_HREF } from "@/services/approval.service";
import type { DirectoryModuleKey } from "@/types";
import { Input, Select, Textarea } from "@/components/ui/FormField";

const MODULE_KEYS: DirectoryModuleKey[] = [
  "dastarkhwan", "imambargah", "place", "darbar",
  "ursDate", "procession", "charity", "mela", "scholar",
];

const fieldLabel = (
  t: (key: string, opts?: Record<string, unknown>) => string,
  labelKey: string | undefined,
  name: string
) => (labelKey ? t(`fields.${labelKey}`) : humanizeFieldName(name));

export function SubmitDirectoryForm({ initialModule }: { initialModule?: DirectoryModuleKey }) {
  const { t } = useTranslation();
  const { data: memberships, isLoading: membershipsLoading } = useMyMemberships();
  const submit = useSubmitDirectory();

  const [module, setModule] = useState<DirectoryModuleKey>(initialModule ?? "dastarkhwan");
  const [organizerId, setOrganizerId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const fields = MODULE_FIELDS[module];

  const setField = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);

    const { payload, errors } = buildSubmissionPayload(module, values, organizerId || undefined);
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    submit.mutate(
      { module, data: payload! },
      {
        onSuccess: () => {
          setDone(true);
          setValues({});
        },
      }
    );
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t("dashboard.module")}
          value={module}
          onChange={(e) => {
            setModule(e.target.value as DirectoryModuleKey);
            setValues({});
            setFieldErrors({});
          }}
          options={MODULE_KEYS.map((k) => ({ value: k, label: t(`approvals.module_${k}`) }))}
        />

        <Select
          label={t("dashboard.submitFor")}
          value={organizerId}
          onChange={(e) => setOrganizerId(e.target.value)}
          disabled={membershipsLoading}
          options={(memberships ?? []).map((m) => ({
            value: m.organizerId,
            label: m.organizer.name,
          }))}
          placeholder={t("dashboard.personal")}
          hint={memberships?.length ? undefined : t("dashboard.personalHint")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const common = {
            id: `sub-${field.name}`,
            label: fieldLabel(t, field.labelKey, field.name),
            required: field.required,
            error: fieldErrors[field.name] || undefined,
            value: values[field.name] ?? "",
          };
          if (field.type === "textarea") {
            return (
              <div key={field.name} className="sm:col-span-2">
                <Textarea {...common} onChange={(e) => setField(field.name, e.target.value)} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <Select
                key={field.name}
                {...common}
                options={(field.options ?? []).map((o) => ({
                  value: o,
                  label: o.replace(/_/g, " "),
                }))}
                onChange={(e) => setField(field.name, e.target.value)}
              />
            );
          }
          return (
            <Input
              key={field.name}
              {...common}
              type={field.type === "number" ? "number" : "text"}
              step={field.type === "number" ? "any" : undefined}
              onChange={(e) => setField(field.name, e.target.value)}
            />
          );
        })}
      </div>

      {submit.isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {t("dashboard.submitError")}
        </p>
      )}
      {done && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("dashboard.submitSuccess")}
        </p>
      )}

      <button
        type="submit"
        disabled={submit.isPending}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submit.isPending ? t("dashboard.submitting") : t("dashboard.submitCta")}
      </button>

      {done && (
        <p className="text-sm text-slate-500">
          <a
            className="text-brand-600 hover:underline"
            href={MODULE_HREF[module]}
          >
            {t("dashboard.viewDirectory")}
          </a>
        </p>
      )}
    </form>
  );
}
