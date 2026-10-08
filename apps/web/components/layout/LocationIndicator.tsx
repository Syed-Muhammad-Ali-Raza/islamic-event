"use client";

import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDetectedLocation } from "@/hooks/useLocation";

interface Props {
  variant?: "compact" | "full";
}

export function LocationIndicator({ variant = "compact" }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useDetectedLocation();

  if (isLoading) {
    if (variant === "compact") {
      return (
        <span
          className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400"
          title={t("footer.detecting")}
        >
          <MapPin size={14} className="animate-pulse" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400">
        <MapPin size={13} className="animate-pulse" />
        {t("footer.detecting")}
      </span>
    );
  }

  if (!data) return null;

  if (variant === "compact") {
    return (
      <span
        className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-full px-2.5 py-1"
        title={`${[data.city, data.region, data.country].filter(Boolean).join(", ")}`}
      >
        <span className="text-sm leading-none">{data.flag}</span>
        {data.country}
      </span>
    );
  }

  const place = [data.city, data.region, data.country].filter(Boolean).join(", ");

  return (
    <span className="inline-flex items-center gap-1.5">
      <MapPin size={13} className="text-brand-600 shrink-0" />
      <span className="text-slate-500">{t("footer.viewingFrom")}</span>
      <span className="text-slate-600 font-medium">{place}</span>
    </span>
  );
}
