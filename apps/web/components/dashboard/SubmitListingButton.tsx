"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useMyMemberships } from "@/hooks/useOrganizations";
import { useAuthStore } from "@/stores/auth.store";
import { isSuperAdminRole } from "@/types";
import type { DirectoryModuleKey } from "@/types";

/**
 * "Submit a listing" CTA shown on directory pages — visible only to super
 * admins and members of an organization (non-members never see a submit
 * button). Hides itself while memberships load.
 */
export function SubmitListingButton({ module }: { module: DirectoryModuleKey }) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const superAdmin = isSuperAdminRole(user?.role);
  const { data: memberships, isSuccess } = useMyMemberships(isAuthenticated);

  if (!isAuthenticated) return null;
  if (!isSuccess) return null; // never flash the button to non-members
  if (!superAdmin && (memberships?.length ?? 0) === 0) return null;

  return (
    <Link
      href={`/dashboard?tab=submit&module=${module}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
    >
      + {t("dashboard.submitCta")}
    </Link>
  );
}
