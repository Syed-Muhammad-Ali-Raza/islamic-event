"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, ExternalLink, AlertTriangle, BookOpen, User, CalendarDays,
  Award, ChevronLeft, ChevronRight, BadgeCheck, ScrollText
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useScholars } from "@/hooks/useScholars";
import type { Scholar, PaginatedResponse } from "@/types";

const SECTS = [
  { value: "", k: "scholars.sectAll" },
  { value: "SUNNI", k: "scholars.sectSunni" },
  { value: "SHIA", k: "scholars.sectShia" },
] as const;

const CATEGORIES = [
  { value: "", k: "scholars.catAll" },
  { value: "SCHOLAR", k: "scholars.catScholar" },
  { value: "MARJA", k: "scholars.catMarja" },
  { value: "KHATEEB", k: "scholars.catKhateeb" },
] as const;

const SECT_CHIP: Record<string, string> = {
  SUNNI: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHIA: "bg-rose-50 text-rose-700 border-rose-200",
};

const SECT_LABEL: Record<string, string> = {
  SUNNI: "scholars.sectSunni",
  SHIA: "scholars.sectShia",
};

const CATEGORY_CHIP: Record<string, { labelKey: string; className: string }> = {
  SCHOLAR: { labelKey: "scholars.catScholar", className: "bg-slate-50 text-slate-600 border-slate-200" },
  MARJA: { labelKey: "scholars.catMarja", className: "bg-sky-50 text-sky-700 border-sky-200" },
  KHATEEB: { labelKey: "scholars.catKhateeb", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const clean = (s: string | null | undefined) =>
  s && s !== "Uncertain" && s !== "Not verified" ? s : null;

function firstOfficialLink(s: Scholar): string | null {
  if (!s.officialLinks) return null;
  const m = s.officialLinks.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

function firstSourceUrl(s: Scholar): string | null {
  return s.sources?.[0]?.url ?? null;
}

export function ScholarsExplorer({
  initialScholars,
  seed,
}: {
  initialScholars?: PaginatedResponse<Scholar>;
  seed: { q: string; sect: string; category: string; page: number };
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [sect, setSect] = useState(seed.sect);
  const [category, setCategory] = useState(seed.category);
  const [page, setPage] = useState(seed.page);

  useEffect(() => {
    setQ(seed.q);
    setInput(seed.q);
    setSect(seed.sect);
    setCategory(seed.category);
    setPage(seed.page);
  }, [seed.q, seed.sect, seed.category, seed.page]);

  const seedMatch =
    page === seed.page && q === seed.q && sect === seed.sect && category === seed.category;
  const { data, isLoading } = useScholars(
    page, q, sect, category, "", 24,
    seedMatch ? initialScholars : undefined
  );

  const pushUrl = (next: { page: number; q?: string; sect?: string; category?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const nsect = next.sect ?? sect;
    const ncat = next.category ?? category;
    if (nq) params.set("q", nq);
    if (nsect) params.set("sect", nsect);
    if (ncat) params.set("category", ncat);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/scholars?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
  };

  const selectSect = (s: string) => {
    setPage(1);
    setSect(s);
    pushUrl({ page: 1, sect: s });
  };

  const selectCategory = (c: string) => {
    setPage(1);
    setCategory(c);
    pushUrl({ page: 1, category: c });
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
          <BookOpen size={14} className="text-amber-600" />
          <span>{t("scholars.headerBadge")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          {t("scholars.title")}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          {t("scholars.subtitle")}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
        <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-relaxed">
          {t("scholars.disclaimerPre")}
          <strong>{t("scholars.disclaimerStrong")}</strong>
          {t("scholars.disclaimerPost")}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {SECTS.map((s) => (
            <button
              key={s.value || "all-sect"}
              onClick={() => selectSect(s.value)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                sect === s.value
                  ? "bg-brand-600 text-white shadow-xs font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70"
              )}
            >
              {t(s.k)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value || "all-cat"}
              onClick={() => selectCategory(c.value)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                category === c.value
                  ? "bg-amber-500 text-slate-950 shadow-xs font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70"
              )}
            >
              {t(c.k)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder={t("scholars.searchPlaceholder")}
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label={t("scholars.searchAria")}
            />
          </div>
          <button
            onClick={applySearch}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xs transition-all active:scale-[0.98] shrink-0"
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
            <BookOpen size={28} />
          </div>
          <p className="text-lg font-bold text-slate-900">{t("scholars.emptyTitle")}</p>
          <p className="text-slate-500 text-sm mt-1">{t("directories.tryProvince")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((scholar) => (
            <div
              key={scholar.id}
              className={clsx(
                "group relative bg-white border border-slate-200/90 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4",
                scholar.sect === "SHIA" ? "border-l-rose-400" : "border-l-emerald-500"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                    <MapPin size={11} className="text-amber-600" />
                    <span>
                      {clean(scholar.city) ?? clean(scholar.country) ?? t("scholars.unknownPlace")}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0",
                        SECT_CHIP[scholar.sect] ?? "bg-slate-50 text-slate-600 border-slate-200"
                      )}
                    >
                      {t(SECT_LABEL[scholar.sect] ?? "scholars.sectSunni")}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight mb-1 group-hover:text-brand-700 transition-colors">
                  {scholar.name}
                </h3>

                {scholar.nameUrdu && (
                  <p className="text-sm text-slate-500 mb-2 font-medium" dir="rtl">
                    {scholar.nameUrdu}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {scholar.category && CATEGORY_CHIP[scholar.category] && (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        CATEGORY_CHIP[scholar.category].className
                      )}
                    >
                      <Award size={11} />
                      {t(CATEGORY_CHIP[scholar.category].labelKey)}
                    </span>
                  )}
                  {scholar.honorific && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <User size={11} />
                      {scholar.honorific}
                    </span>
                  )}
                  {(scholar.birthDate || scholar.deathDate) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <CalendarDays size={11} />
                      {clean(scholar.birthDate) && `${scholar.birthDate} – `}
                      {clean(scholar.deathDate) ?? "?"}
                    </span>
                  )}
                </div>

                {scholar.education && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {scholar.education}
                  </p>
                )}

                {scholar.bio && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                    {scholar.bio}
                  </p>
                )}

                {scholar.works && scholar.works.length > 0 && (
                  <div className="mb-3 inline-flex items-start gap-1.5 text-xs text-slate-500">
                    <ScrollText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {scholar.works.slice(0, 3).join(" · ")}
                      {scholar.works.length > 3 && " …"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto flex-wrap">
                {firstOfficialLink(scholar) && (
                  <a
                    href={firstOfficialLink(scholar)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
                  >
                    <ExternalLink size={13} />
                    <span>{t("scholars.official")}</span>
                  </a>
                )}
                {firstSourceUrl(scholar) && (
                  <a
                    href={firstSourceUrl(scholar)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    title={t("directories.source")}
                  >
                    <span>{t("directories.source")}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
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
            <ChevronLeft size={14} className="inline -mt-0.5 mr-1" />
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
            <ChevronRight size={14} className="inline -mt-0.5 ml-1" />
          </button>
        </div>
      )}

      {data && (
        <p className="text-center text-xs text-slate-400 mt-6">
          {t(data.pagination.total === 1 ? "scholars.listedOne" : "scholars.listedOther", {
            count: data.pagination.total,
          })}
        </p>
      )}
    </div>
  );
}
