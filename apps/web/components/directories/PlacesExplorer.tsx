"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ExternalLink, AlertTriangle, Landmark, Clock, Ticket, Building2, Award } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { usePlaces } from "@/hooks/usePlaces";
import type { PaginatedResponse, Place } from "@/types";

const CATEGORIES = [
  { value: "", k: "places.catAll" },
  { value: "Historical", k: "places.catHistorical" },
  { value: "Religious", k: "places.catReligious" },
  { value: "Cultural", k: "places.catCultural" },
  { value: "Natural / Tourist", k: "places.catNatural" },
];

const PROVINCES = [
  { value: "", k: "directories.allProvinces" },
  { value: "Punjab", k: "directories.provinces.punjab" },
  { value: "Sindh", k: "directories.provinces.sindh" },
  { value: "Khyber Pakhtunkhwa", k: "directories.provinces.kpk" },
  { value: "Balochistan", k: "directories.provinces.balochistan" },
  { value: "Gilgit-Baltistan", k: "directories.provinces.gilgit" },
  { value: "Islamabad Capital Territory", k: "directories.provinces.ict" },
];

const TYPE_STYLE: Record<string, { labelKey: string; chip: string; rule: string }> = {
  Fort: {
    labelKey: "places.typeFort",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rule: "border-l-emerald-500",
  },
  Shrine: {
    labelKey: "places.typeShrine",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    rule: "border-l-amber-400",
  },
  Museum: {
    labelKey: "places.typeMuseum",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    rule: "border-l-rose-500",
  },
  Valley: {
    labelKey: "places.typeValley",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rule: "border-l-emerald-500",
  },
  "National Park": {
    labelKey: "places.typeNationalPark",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    rule: "border-l-amber-400",
  },
  Mosque: {
    labelKey: "places.typeMosque",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    rule: "border-l-rose-500",
  },
  Temple: {
    labelKey: "places.typeTemple",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rule: "border-l-emerald-500",
  },
  Church: {
    labelKey: "places.typeChurch",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    rule: "border-l-amber-400",
  },
  "Historic Site": {
    labelKey: "places.typeHistoricSite",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    rule: "border-l-rose-500",
  },
  "Archaeological Site": {
    labelKey: "places.typeArchaeological",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rule: "border-l-emerald-500",
  },
};

const clean = (s: string | null | undefined) => (s && s !== "N/A" ? s : null);

function unescoBadge(status: string | null, t: (k: string) => string) {
  if (!status || status === "Not inscribed") return null;
  if (status.startsWith("UNESCO World Heritage")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        <Award size={10} /> {t("places.unescoHeritage")}
      </span>
    );
  }
  if (status.includes("Tentative")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
        <Award size={10} /> {t("places.unescoTentative")}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{status}</span>
  );
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export function PlacesExplorer({
  initialData,
  seed,
}: {
  initialData?: PaginatedResponse<Place>;
  seed: { q: string; category: string; province: string; page: number };
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [category, setCategory] = useState(seed.category);
  const [province, setProvince] = useState(seed.province);
  const [page, setPage] = useState(seed.page);

  useEffect(() => {
    setQ(seed.q);
    setInput(seed.q);
    setCategory(seed.category);
    setProvince(seed.province);
    setPage(seed.page);
  }, [seed.q, seed.category, seed.province, seed.page]);

  const seedMatch =
    page === seed.page && q === seed.q && category === seed.category && province === seed.province;
  const { data, isLoading } = usePlaces(page, q, category, province, 24, seedMatch ? initialData : undefined);

  const pushUrl = (next: { page: number; q?: string; category?: string; province?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const ncat = next.category ?? category;
    const nprov = next.province ?? province;
    if (nq) params.set("q", nq);
    if (ncat) params.set("category", ncat);
    if (nprov) params.set("province", nprov);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/places?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
  };

  const selectCategory = (c: string) => {
    setPage(1);
    setCategory(c);
    pushUrl({ page: 1, category: c });
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
    pushUrl({ page: 1, province: p });
  };

  const gotoPage = (np: number) => {
    setPage(np);
    pushUrl({ page: np });
  };

  return (
    <div className="container-page py-10 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <Landmark size={14} className="text-amber-600" />
          <span>Landmarks & Heritage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          {t("places.title")}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">{t("places.subtitle")}</p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
        <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />
        <p className="leading-relaxed">
          {t("places.disclaimerPre")}
          <strong>{t("places.disclaimerStrong")}</strong>
          {t("places.disclaimerPost")}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value || "all"}
              onClick={() => selectCategory(c.value)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                focusRing,
                category === c.value
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
              placeholder={t("places.searchPlaceholder")}
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label={t("places.searchAria")}
            />
          </div>
          <select
            value={province}
            onChange={(e) => selectProvince(e.target.value)}
            className="w-full sm:w-auto shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none appearance-none cursor-pointer"
            aria-label={t("directories.filterProvince")}
          >
            {PROVINCES.map((p) => (
              <option key={p.value || "all"} value={p.value}>
                {t(p.k)}
              </option>
            ))}
          </select>
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
            <Landmark size={28} />
          </div>
          <p className="text-lg font-bold text-slate-900">{t("places.emptyTitle")}</p>
          <p className="text-slate-500 text-sm mt-1">{t("directories.tryFilters")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((place) => {
            const typeStyle = TYPE_STYLE[place.type] ?? {
              labelKey: place.type,
              chip: "bg-slate-50 text-slate-500 border-slate-200",
              rule: "border-l-slate-300",
            };
            const ruleCls = place.verified ? "border-l-emerald-500" : typeStyle.rule;

            return (
              <article
                key={place.id}
                className={clsx(
                  "group relative bg-white border border-slate-200/90 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4",
                  ruleCls
                )}
              >
                <div>
                  {/* Location + UNESCO badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 min-w-0">
                      <MapPin size={11} className="shrink-0 text-amber-600" aria-hidden />
                      <span className="truncate">{place.city} · {place.province}</span>
                    </span>
                    {unescoBadge(place.unescoStatus, t)}
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight mb-2 group-hover:text-brand-700 transition-colors">
                    {place.name}
                  </h3>

                  {/* Type badge */}
                  <p className="mb-2 inline-flex items-center gap-1.5">
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        typeStyle.chip
                      )}
                    >
                      {t(typeStyle.labelKey)}
                    </span>
                  </p>

                  {clean(place.description) && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{place.description}</p>
                  )}

                  {clean(place.builtYear) && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 size={12} className="text-slate-400 shrink-0" aria-hidden />
                      <span>
                        {t("places.built")}: {place.builtYear}
                        {clean(place.builtBuilder) ? ` — ${place.builtBuilder}` : ""}
                      </span>
                    </p>
                  )}

                  {clean(place.timings) && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} className="text-slate-400 shrink-0" aria-hidden />
                      {place.timings}
                    </p>
                  )}

                  {clean(place.ticket) && (
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Ticket size={12} className="text-slate-400 shrink-0" aria-hidden />
                      {place.ticket}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {(place.mapLink || place.sourceLink) && (
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    {place.mapLink && (
                      <a
                        href={place.mapLink}
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
                    {place.sourceLink && (
                      <a
                        href={place.sourceLink}
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
          {t(data.pagination.total === 1 ? "places.listedOne" : "places.listedOther", {
            count: data.pagination.total,
          })}
        </p>
      )}
    </div>
  );
}
