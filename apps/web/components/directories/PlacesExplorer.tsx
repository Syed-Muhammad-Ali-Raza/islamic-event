"use client";

import { useState } from "react";
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

const clean = (s: string | null | undefined) => (s && s !== "N/A" ? s : null);

function unescoBadge(status: string | null, t: (k: string) => string) {
  if (!status || status === "Not inscribed") return null;
  if (status.startsWith("UNESCO World Heritage")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <Award size={10} /> {t("places.unescoHeritage")}
      </span>
    );
  }
  if (status.includes("Tentative")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
        <Award size={10} /> {t("places.unescoTentative")}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{status}</span>
  );
}

export function PlacesExplorer({ initialData }: { initialData?: PaginatedResponse<Place> }) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePlaces(page, q, category, province, 24, initialData);

  const applySearch = () => {
    setPage(1);
    setQ(input);
  };

  const selectCategory = (c: string) => {
    setPage(1);
    setCategory(c);
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Landmark size={26} className="text-brand-600" /> {t("places.title")}
        </h1>
        <p className="text-slate-500 text-sm">{t("places.subtitle")}</p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
        <p>
          {t("places.disclaimerPre")}
          <strong>{t("places.disclaimerStrong")}</strong>
          {t("places.disclaimerPost")}
        </p>
      </div>

      {/* Category tabs + province + search */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value || "all"}
                onClick={() => selectCategory(c.value)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  category === c.value
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                )}
              >
                {t(c.k)}
              </button>
            ))}
          </div>

          <select
            value={province}
            onChange={(e) => selectProvince(e.target.value)}
            className="ml-auto input px-3 py-2 text-xs"
            aria-label={t("directories.filterProvince")}
          >
            {PROVINCES.map((p) => (
              <option key={p.value || "all"} value={p.value}>
                {t(p.k)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto max-w-sm">
          <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
            <Search size={15} className="text-brand-600 shrink-0" />
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
          <button onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
            {t("directories.search")}
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">🏛️</p>
          <p className="text-lg font-medium text-slate-900">{t("places.emptyTitle")}</p>
          <p className="text-slate-500 text-sm mt-1">{t("directories.tryFilters")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((place) => (
            <div key={place.id} className="card-glass p-5 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 leading-snug">{place.name}</h3>
                {unescoBadge(place.unescoStatus, t)}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="badge-brand text-[10px]">{place.type}</span>
                <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {place.city} · {place.province}
                </span>
              </div>

              {place.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{place.description}</p>
              )}

              {clean(place.builtYear) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Building2 size={12} className="text-brand-600 shrink-0 mt-0.5" />
                  <span>
                    {t("places.built")}: {place.builtYear}
                    {clean(place.builtBuilder) ? ` — ${place.builtBuilder}` : ""}
                  </span>
                </p>
              )}

              {clean(place.timings) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Clock size={12} className="text-brand-600 shrink-0 mt-0.5" /> {place.timings}
                </p>
              )}

              {clean(place.ticket) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Ticket size={12} className="text-brand-600 shrink-0 mt-0.5" /> {place.ticket}
                </p>
              )}

              <div className="mt-auto pt-2 flex items-center gap-2">
                {place.mapLink && (
                  <a
                    href={place.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                  >
                    <MapPin size={12} /> {t("directories.openMaps")}
                  </a>
                )}
                {place.sourceLink && (
                  <a
                    href={place.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-700 transition-colors"
                  >
                    {t("directories.source")} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            {t("directories.prev")}
          </button>
          <span className="text-slate-500 text-sm">
            {t("directories.pageOf", { page: data.pagination.page, total: data.pagination.totalPages })}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
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
