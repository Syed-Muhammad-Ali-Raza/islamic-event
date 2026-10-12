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
    chip: "bg-[#1F5C46]/[0.08] text-[#1F5C46]",
    rule: "border-l-[#1F5C46]/60",
  },
  Shrine: {
    labelKey: "places.typeShrine",
    chip: "bg-[#A8660F]/10 text-[#8A520A]",
    rule: "border-l-[#A8660F]",
  },
  Museum: {
    labelKey: "places.typeMuseum",
    chip: "bg-[#7A2530]/[0.08] text-[#7A2530]",
    rule: "border-l-[#7A2530]",
  },
  Valley: {
    labelKey: "places.typeValley",
    chip: "bg-[#1F5C46]/[0.08] text-[#1F5C46]",
    rule: "border-l-[#1F5C46]/60",
  },
  "National Park": {
    labelKey: "places.typeNationalPark",
    chip: "bg-[#A8660F]/10 text-[#8A520A]",
    rule: "border-l-[#A8660F]",
  },
  Mosque: {
    labelKey: "places.typeMosque",
    chip: "bg-[#7A2530]/[0.08] text-[#7A2530]",
    rule: "border-l-[#7A2530]",
  },
  Temple: {
    labelKey: "places.typeTemple",
    chip: "bg-[#1F5C46]/[0.08] text-[#1F5C46]",
    rule: "border-l-[#1F5C46]/60",
  },
  Church: {
    labelKey: "places.typeChurch",
    chip: "bg-[#A8660F]/10 text-[#8A520A]",
    rule: "border-l-[#A8660F]",
  },
  "Historic Site": {
    labelKey: "places.typeHistoricSite",
    chip: "bg-[#7A2530]/[0.08] text-[#7A2530]",
    rule: "border-l-[#7A2530]",
  },
  "Archaeological Site": {
    labelKey: "places.typeArchaeological",
    chip: "bg-[#1F5C46]/[0.08] text-[#1F5C46]",
    rule: "border-l-[#1F5C46]/60",
  },
};

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

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5C46]";

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

  const pagerBtn = clsx(
    "cursor-pointer rounded-md border border-[#C3CEC8] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[#1F5C46] hover:text-[#1F5C46] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#C3CEC8] disabled:hover:text-inherit",
    focusRing
  );

  return (
    <div className="container-page py-10 sm:py-14 text-[#17211D]">
      {/* Header */}
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl inline-flex items-center gap-2">
          <Landmark size={26} className="text-[#1F5C46]" aria-hidden />
          {t("places.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#44524B]">{t("places.subtitle")}</p>
      </header>

      {/* Disclaimer */}
      <aside
        role="note"
        className="mt-8 flex max-w-3xl items-start gap-3 rounded-md border-l-4 border-[#A8660F] bg-[#A8660F]/[0.08] px-4 py-3.5 text-sm text-[#5E3A06]"
      >
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#A8660F]" aria-hidden />
        <p className="leading-relaxed">
          {t("places.disclaimerPre")}
          <strong className="font-semibold">{t("places.disclaimerStrong")}</strong>
          {t("places.disclaimerPost")}
        </p>
      </aside>

      {/* Filters */}
      <div className="mt-8 space-y-4 border-y border-[#D5DDD8] py-4">
        <div
          role="tablist"
          aria-label="Filter by category"
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <button
                key={c.value || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectCategory(c.value)}
                className={clsx(
                  "shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  focusRing,
                  active
                    ? "bg-[#17211D] text-white"
                    : "text-[#44524B] hover:bg-[#EEF2EF] hover:text-[#17211D]"
                )}
              >
                {t(c.k)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch max-w-4xl">
          <div className="flex-1 flex items-center gap-2.5 rounded-md border border-[#C3CEC8] bg-white px-3.5 py-2.5 focus-within:border-[#1F5C46] focus-within:ring-2 focus-within:ring-[#1F5C46]/20">
            <Search size={16} className="shrink-0 text-[#1F5C46]" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder={t("places.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-[#17211D] placeholder-[#7B8882] focus:outline-none"
              aria-label={t("places.searchAria")}
            />
          </div>
          <select
            value={province}
            onChange={(e) => selectProvince(e.target.value)}
            className="w-full sm:w-auto shrink-0 rounded-md border border-[#C3CEC8] bg-white px-3.5 py-2.5 text-sm font-medium text-[#44524B] focus:border-[#1F5C46] focus:outline-none focus:ring-2 focus:ring-[#1F5C46]/20 appearance-none cursor-pointer"
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
              "shrink-0 cursor-pointer rounded-md bg-[#1F5C46] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#184a39]",
              focusRing
            )}
          >
            {t("directories.search")}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg border border-[#D5DDD8] bg-[#EEF2EF]" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#C3CEC8] bg-[#EEF2EF]/60 px-6 py-14 text-center">
            <Landmark size={28} className="mx-auto mb-3 text-[#1F5C46]" aria-hidden />
            <p className="font-serif text-xl font-semibold">{t("places.emptyTitle")}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#44524B]">{t("directories.tryFilters")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((place) => {
              const typeStyle = TYPE_STYLE[place.type] ?? {
                labelKey: place.type,
                chip: "bg-[#EEF2EF] text-[#44524B]",
                rule: "border-l-[#9AA9A1]",
              };
              const ruleCls = place.verified ? "border-l-[#1F5C46]" : typeStyle.rule;

              return (
                <article
                  key={place.id}
                  className={clsx(
                    "flex flex-col justify-between rounded-lg border border-[#D5DDD8] border-l-4 bg-white p-5 sm:p-6",
                    ruleCls
                  )}
                >
                  <div>
                    {/* Location + UNESCO badge */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[#44524B]">
                        <MapPin size={14} className="shrink-0 text-[#1F5C46]" aria-hidden />
                        <span className="truncate">{place.city} · {place.province}</span>
                      </p>
                      {unescoBadge(place.unescoStatus, t)}
                    </div>

                    {/* Name */}
                    <h3 className="mt-3 font-serif text-xl font-semibold leading-snug">{place.name}</h3>

                    {/* Type badge */}
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
                      <Landmark size={14} className="text-[#A8660F]" aria-hidden />
                      {t(typeStyle.labelKey)}
                    </p>

                    {clean(place.description) && (
                      <p className="mt-3 text-sm leading-relaxed text-[#44524B]">{place.description}</p>
                    )}

                    {clean(place.builtYear) && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
                        <Building2 size={14} className="text-[#A8660F]" aria-hidden />
                        <span>
                          {t("places.built")}: {place.builtYear}
                          {clean(place.builtBuilder) ? ` — ${place.builtBuilder}` : ""}
                        </span>
                      </p>
                    )}

                    {clean(place.timings) && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
                        <Clock size={14} className="text-[#A8660F]" aria-hidden />
                        {place.timings}
                      </p>
                    )}

                    {clean(place.ticket) && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
                        <Ticket size={14} className="text-[#A8660F]" aria-hidden />
                        {place.ticket}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {(place.mapLink || place.sourceLink) && (
                    <div className="mt-5 flex items-center gap-2 pt-1">
                      {place.mapLink && (
                        <a
                          href={place.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={clsx(
                            "inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1F5C46] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#184a39]",
                            focusRing
                          )}
                        >
                          <MapPin size={15} aria-hidden />
                          {t("directories.openMaps")}
                        </a>
                      )}
                      {place.sourceLink && (
                        <a
                          href={place.sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t("directories.source")}
                          className={clsx(
                            "inline-flex items-center justify-center gap-1.5 rounded-md border border-[#C3CEC8] bg-white px-3.5 py-2 text-sm font-medium text-[#44524B] transition-colors hover:border-[#1F5C46] hover:text-[#1F5C46]",
                            focusRing
                          )}
                        >
                          {t("directories.source")}
                          <ExternalLink size={13} aria-hidden />
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-between border-t border-[#D5DDD8] pt-5"
        >
          <button disabled={page === 1} onClick={() => gotoPage(page - 1)} className={pagerBtn}>
            {t("directories.prev")}
          </button>
          <span className="text-sm text-[#5B6962]">
            {t("directories.pageOf", { page: data.pagination.page, total: data.pagination.totalPages })}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => gotoPage(page + 1)}
            className={pagerBtn}
          >
            {t("directories.next")}
          </button>
        </nav>
      )}

      {data && (
        <p className="mt-6 text-center text-xs text-[#6C7973]">
          {t(data.pagination.total === 1 ? "places.listedOne" : "places.listedOther", {
            count: data.pagination.total,
          })}
        </p>
      )}
    </div>
  );
}