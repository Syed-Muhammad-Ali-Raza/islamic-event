"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, ExternalLink, BadgeCheck, AlertTriangle, Soup } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useDastarkhwans } from "@/hooks/useDastarkhwans";
import type { Dastarkhwan, PaginatedResponse } from "@/types";

const CITIES = [
  { v: "", k: "directories.allCities" },
  { v: "Lahore", k: "directories.cities.lahore" },
  { v: "Karachi", k: "directories.cities.karachi" },
  { v: "Faisalabad", k: "directories.cities.faisalabad" },
  { v: "Multan", k: "directories.cities.multan" },
];

const TYPE_STYLE: Record<string, { labelKey: string; chip: string; rule: string }> = {
  langar: {
    labelKey: "dastarkhwan.typeLangar",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rule: "border-l-emerald-500",
  },
  dastarkhwan: {
    labelKey: "dastarkhwan.typeDastarkhwan",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    rule: "border-l-amber-400",
  },
  both: {
    labelKey: "dastarkhwan.typeBoth",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    rule: "border-l-sky-500",
  },
};

const clean = (s: string | null | undefined) => (s && s !== "Not stated" ? s : null);

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export function DastarkhwanExplorer({
  initialData,
  seed,
}: {
  initialData?: PaginatedResponse<Dastarkhwan>;
  seed: { q: string; city: string; page: number };
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [city, setCity] = useState(seed.city);
  const [page, setPage] = useState(seed.page);

  useEffect(() => {
    setQ(seed.q);
    setInput(seed.q);
    setCity(seed.city);
    setPage(seed.page);
  }, [seed.q, seed.city, seed.page]);

  const seedMatch = page === seed.page && q === seed.q && city === seed.city;
  const { data, isLoading } = useDastarkhwans(page, q, city, 24, seedMatch ? initialData : undefined);

  const pushUrl = (next: { page: number; q?: string; city?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const ncity = next.city ?? city;
    if (nq) params.set("q", nq);
    if (ncity) params.set("city", ncity);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/dastarkhwan?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
  };

  const selectCity = (c: string) => {
    setPage(1);
    setCity(c);
    pushUrl({ page: 1, city: c });
  };

  const gotoPage = (p: number) => {
    setPage(p);
    pushUrl({ page: p });
  };

  return (
    <div className="container-page py-10 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <Soup size={14} className="text-amber-600" />
          <span>Free Food Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          {t("dastarkhwan.title")}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          {t("dastarkhwan.subtitle")}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
        <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />
        <p className="leading-relaxed">
          {t("dastarkhwan.disclaimerPre")}
          <strong>{t("dastarkhwan.disclaimerStrong")}</strong>
          {t("dastarkhwan.disclaimerPost")}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {CITIES.map((c) => (
            <button
              key={c.v || "all"}
              onClick={() => selectCity(c.v)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                focusRing,
                city === c.v
                  ? "bg-brand-600 text-white shadow-xs font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70"
              )}
            >
              {t(c.k)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Search size={16} className="text-slate-400 shrink-0" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder={t("dastarkhwan.searchPlaceholder")}
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label={t("dastarkhwan.searchAria")}
            />
          </div>
          <button
            type="button"
            onClick={applySearch}
            className={clsx(
              "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.98] shrink-0 cursor-pointer",
              focusRing
            )}
          >
            <span>{t("directories.search")}</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-16 px-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
            <Soup size={28} />
          </div>
          <p className="text-lg font-bold text-slate-900">{t("dastarkhwan.emptyTitle")}</p>
          <p className="text-slate-500 text-sm mt-1">{t("directories.tryCity")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((point) => {
            const typeStyle = TYPE_STYLE[point.type?.toLowerCase()] ?? {
              labelKey: point.type,
              chip: "bg-slate-50 text-slate-500 border-slate-200",
              rule: "border-l-slate-300",
            };
            const ruleCls = point.verified ? "border-l-emerald-500" : typeStyle.rule;

            return (
              <article
                key={point.id}
                className={clsx(
                  "group relative bg-white border border-slate-200/90 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4",
                  ruleCls
                )}
              >
                <div>
                  {/* Location + trust badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 min-w-0">
                      <MapPin size={11} className="shrink-0 text-amber-600" aria-hidden />
                      <span className="truncate">
                        {point.city}
                        {point.area && clean(point.area) && `, ${point.area}`}
                      </span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {point.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          <BadgeCheck size={11} aria-hidden /> {t("directories.verified")}
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            typeStyle.chip
                          )}
                        >
                          {t(typeStyle.labelKey)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight mb-2 group-hover:text-brand-700 transition-colors">
                    {point.name}
                  </h3>

                  {clean(point.type) && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Soup size={12} className="text-amber-600 shrink-0" aria-hidden />
                      {t(typeStyle.labelKey)}
                    </p>
                  )}

                  {clean(point.schedule) && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} className="text-slate-400 shrink-0" aria-hidden />
                      {point.schedule}
                    </p>
                  )}

                  {clean(point.address) && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{point.address}</p>
                  )}

                  {clean(point.notes) && (
                    <p className="text-xs italic text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      {point.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {(point.googleMapsUrl || point.sourceUrl) && (
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    {point.googleMapsUrl && (
                      <a
                        href={point.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(
                          "inline-flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]",
                          focusRing
                        )}
                      >
                        <MapPin size={13} aria-hidden />
                        <span>{t("directories.openMaps")}</span>
                      </a>
                    )}
                    {point.sourceUrl && (
                      <a
                        href={point.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("directories.source")}
                        className={clsx(
                          "inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors",
                          focusRing
                        )}
                      >
                        <span>{t("directories.source")}</span>
                        <ExternalLink size={12} aria-hidden />
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => gotoPage(page - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            {t("directories.prev")}
          </button>
          <span className="text-slate-500 text-sm font-medium">
            {t("directories.pageOf", { page: data.pagination.page, total: data.pagination.totalPages })}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => gotoPage(page + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            {t("directories.next")}
          </button>
        </div>
      )}

      {data && (
        <p className="text-center text-xs text-slate-400 mt-6">
          {t(data.pagination.total === 1 ? "dastarkhwan.listedOne" : "dastarkhwan.listedOther", {
            count: data.pagination.total,
          })}
        </p>
      )}
    </div>
  );
}
