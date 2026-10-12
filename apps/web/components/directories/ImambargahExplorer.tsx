"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, History, ExternalLink, BadgeCheck, AlertTriangle, Landmark, Phone, User,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useImambargahs } from "@/hooks/useImambargahs";
import type { Imambargah, PaginatedResponse } from "@/types";

/*
  Tokens (shared with MuharramJaloos)
  ink #17211D · alam #1F5C46 · azadar #7A2530 · amber #A8660F · mist #EEF2EF · line #D5DDD8
*/

const CITIES = [
  { v: "", k: "directories.allCities" },
  { v: "Lahore", k: "directories.cities.lahore" },
  { v: "Karachi", k: "directories.cities.karachi" },
  { v: "Rawalpindi", k: "directories.cities.rawalpindi" },
  { v: "Islamabad", k: "directories.cities.islamabad" },
  { v: "Peshawar", k: "directories.cities.peshawar" },
  { v: "Quetta", k: "directories.cities.quetta" },
  { v: "Hyderabad", k: "directories.cities.hyderabad" },
];

// Rule colour on the card edge shows how trustworthy the listing is.
const CONFIDENCE_STYLE: Record<string, { labelKey: string; chip: string; rule: string }> = {
  "news/heritage source": {
    labelKey: "imambargahs.confHeritage",
    chip: "bg-[#1F5C46]/[0.08] text-[#1F5C46]",
    rule: "border-l-[#1F5C46]/60",
  },
  "map listing": {
    labelKey: "imambargahs.confMap",
    chip: "bg-[#EEF2EF] text-[#44524B]",
    rule: "border-l-[#9AA9A1]",
  },
  "social page title only": {
    labelKey: "imambargahs.confSocial",
    chip: "bg-[#A8660F]/10 text-[#8A520A]",
    rule: "border-l-[#A8660F]",
  },
  "unconfirmed (Gemini list only)": {
    labelKey: "imambargahs.confUnconfirmed",
    chip: "bg-[#7A2530]/[0.08] text-[#7A2530]",
    rule: "border-l-[#7A2530]",
  },
};

const clean = (s: string | null | undefined) => (s && s !== "Not stated" ? s : null);

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5C46]";

export function ImambargahExplorer({
  initialData,
  seed,
}: {
  initialData?: PaginatedResponse<Imambargah>;
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
  const { data, isLoading } = useImambargahs(page, q, city, 24, seedMatch ? initialData : undefined);

  const pushUrl = (next: { page: number; q?: string; city?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const ncity = next.city ?? city;
    if (nq) params.set("q", nq);
    if (ncity) params.set("city", ncity);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/imambargahs?${params.toString()}`);
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

  const pagerBtn = clsx(
    "cursor-pointer rounded-md border border-[#C3CEC8] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[#1F5C46] hover:text-[#1F5C46] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#C3CEC8] disabled:hover:text-inherit",
    focusRing
  );

  return (
    <div className="container-page py-10 sm:py-14 text-[#17211D]">
      {/* Header */}
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("imambargahs.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#44524B]">
          {t("imambargahs.subtitle")}
        </p>
      </header>

      {/* Disclaimer */}
      <aside
        role="note"
        className="mt-8 flex max-w-3xl items-start gap-3 rounded-md border-l-4 border-[#A8660F] bg-[#A8660F]/[0.08] px-4 py-3.5 text-sm text-[#5E3A06]"
      >
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#A8660F]" aria-hidden />
        <p className="leading-relaxed">
          {t("imambargahs.disclaimerPre")}
          <strong className="font-semibold">{t("imambargahs.disclaimerStrong")}</strong>
          {t("imambargahs.disclaimerPost")}
        </p>
      </aside>

      {/* Filters */}
      <div className="mt-8 space-y-4 border-y border-[#D5DDD8] py-4">
        <div
          role="tablist"
          aria-label="Filter by city"
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
          {CITIES.map((c) => {
            const active = city === c.v;
            return (
              <button
                key={c.v || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectCity(c.v)}
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

        <div className="flex max-w-md gap-2">
          <label className="flex flex-1 items-center gap-2.5 rounded-md border border-[#C3CEC8] bg-white px-3.5 py-2.5 focus-within:border-[#1F5C46] focus-within:ring-2 focus-within:ring-[#1F5C46]/20">
            <Search size={16} className="shrink-0 text-[#1F5C46]" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder={t("imambargahs.searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-[#17211D] placeholder-[#7B8882] focus:outline-none"
              aria-label={t("imambargahs.searchAria")}
            />
          </label>
          <button
            type="button"
            onClick={applySearch}
            className={clsx(
              "cursor-pointer rounded-md bg-[#1F5C46] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#184a39]",
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
              <div
                key={i}
                className="h-64 animate-pulse rounded-lg border border-[#D5DDD8] bg-[#EEF2EF]"
              />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#C3CEC8] bg-[#EEF2EF]/60 px-6 py-14 text-center">
            <Landmark size={28} className="mx-auto mb-3 text-[#1F5C46]" aria-hidden />
            <p className="font-serif text-xl font-semibold">{t("imambargahs.emptyTitle")}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#44524B]">{t("directories.tryCity")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((point) => {
              const conf = CONFIDENCE_STYLE[point.confidence] ?? {
                labelKey: point.confidence,
                chip: "bg-[#EEF2EF] text-[#44524B]",
                rule: "border-l-[#9AA9A1]",
              };
              const ruleCls = point.verified ? "border-l-[#1F5C46]" : conf.rule;

              return (
                <article
                  key={point.id}
                  className={clsx(
                    "flex flex-col justify-between rounded-lg border border-[#D5DDD8] border-l-4 bg-white p-5 sm:p-6",
                    ruleCls
                  )}
                >
                  <div>
                    {/* Location + trust badge */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="inline-flex min-w-0 items-center gap-1.5 text-sm text-[#44524B]">
                        <MapPin size={14} className="shrink-0 text-[#1F5C46]" aria-hidden />
                        <span className="truncate">
                          {point.city}
                          {point.area && clean(point.area) && `, ${point.area}`}
                        </span>
                      </p>

                      {point.verified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1F5C46] px-2.5 py-1 text-xs font-medium text-white">
                          <BadgeCheck size={13} aria-hidden /> {t("directories.verified")}
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                            conf.chip
                          )}
                        >
                          {t(conf.labelKey)}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="mt-3 font-serif text-xl font-semibold leading-snug">
                      {point.name}
                    </h3>

                    {clean(point.yearBuilt) && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
                        <History size={14} className="text-[#7A2530]" aria-hidden />
                        {point.yearBuilt}
                      </p>
                    )}

                    {clean(point.address) && (
                      <p className="mt-3 text-sm leading-relaxed text-[#44524B]">{point.address}</p>
                    )}

                    {(clean(point.founderOrCaretaker) || clean(point.contact)) && (
                      <div className="mt-4 space-y-2 rounded-md bg-[#EEF2EF] px-3.5 py-3 text-sm">
                        {clean(point.founderOrCaretaker) && (
                          <p className="flex items-center gap-2 text-[#44524B]">
                            <User size={14} className="shrink-0 text-[#6C7973]" aria-hidden />
                            <span className="truncate">{point.founderOrCaretaker}</span>
                          </p>
                        )}
                        {clean(point.contact) && (
                          <a
                            href={`tel:${point.contact!.replace(/[^+\d]/g, "")}`}
                            className={clsx(
                              "inline-flex items-center gap-2 rounded font-medium text-[#1F5C46] hover:underline",
                              focusRing
                            )}
                          >
                            <Phone size={14} className="shrink-0" aria-hidden />
                            {point.contact}
                          </a>
                        )}
                      </div>
                    )}

                    {clean(point.notes) && (
                      <blockquote className="mt-4 border-l-2 border-[#C3CEC8] pl-3.5 text-sm italic leading-relaxed text-[#44524B]">
                        {point.notes}
                      </blockquote>
                    )}
                  </div>

                  {/* Actions */}
                  {(point.googleMapsUrl || point.sourceUrl) && (
                    <div className="mt-5 flex items-center gap-2 pt-1">
                      {point.googleMapsUrl && (
                        <a
                          href={point.googleMapsUrl}
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
                      {point.sourceUrl && (
                        <a
                          href={point.sourceUrl}
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
          {t(data.pagination.total === 1 ? "imambargahs.listedOne" : "imambargahs.listedOther", {
            count: data.pagination.total,
          })}
        </p>
      )}
    </div>
  );
}