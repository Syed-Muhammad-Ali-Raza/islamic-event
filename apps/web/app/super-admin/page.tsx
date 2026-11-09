"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Building2, CheckCircle2 } from "lucide-react";

const CARDS = [
  { href: "/super-admin/orgs", titleKey: "superAdmin.cardOrgs", descKey: "superAdmin.cardOrgsDesc", icon: Building2 },
  { href: "/approvals", titleKey: "superAdmin.cardApprovals", descKey: "superAdmin.cardApprovalsDesc", icon: CheckCircle2 },
] as const;

export default function SuperAdminHomePage() {
  const { t } = useTranslation();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-slate-900">{t("superAdmin.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("superAdmin.subtitle")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
          >
            <card.icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
            <h2 className="mt-2 font-semibold text-slate-900">{t(card.titleKey)}</h2>
            <p className="mt-1 text-sm text-slate-500">{t(card.descKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
