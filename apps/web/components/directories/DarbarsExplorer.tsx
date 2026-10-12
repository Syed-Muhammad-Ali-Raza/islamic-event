"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, ExternalLink, AlertTriangle, Sparkles, Clock, CalendarDays, User,
  BookOpen, ListOrdered, ChevronDown, ChevronUp, Info, Moon, Star, BadgeCheck
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useDarbars } from "@/hooks/useDarbars";
import { useUrsDates } from "@/hooks/useUrsDates";
import type { Darbar, PaginatedResponse, UrsDate } from "@/types";

const PROVINCES = [
  { value: "", k: "directories.allProvinces" },
  { value: "Punjab", k: "directories.provinces.punjab" },
  { value: "Sindh", k: "directories.provinces.sindh" },
  { value: "Khyber Pakhtunkhwa", k: "directories.provinces.kpk" },
  { value: "Balochistan", k: "directories.provinces.balochistan" },
  { value: "Gilgit-Baltistan", k: "directories.provinces.gilgit" },
  { value: "Islamabad Capital Territory", k: "directories.provinces.ict" },
  { value: "Azad Jammu & Kashmir", k: "directories.provinces.ajk" },
];

const CALENDAR_ANCHORS = [
  { lk: "darbars.anchor1Label", dk: "darbars.anchor1Date" },
  { lk: "darbars.anchor2Label", dk: "darbars.anchor2Date" },
  { lk: "darbars.anchor3Label", dk: "darbars.anchor3Date" },
];

const CONFIDENCE_CHIP: Record<string, { labelKey: string; className: string }> = {
  high: { labelKey: "darbars.confHigh", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { labelKey: "darbars.confMedium", className: "bg-sky-50 text-sky-700 border-sky-200" },
  low: { labelKey: "darbars.confLow", className: "bg-amber-50 text-amber-700 border-amber-200" },
  none: { labelKey: "darbars.confNone", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

const clean = (s: string | null | undefined) => (s && s !== "Uncertain" && s !== "Not verified" ? s : null);

function confidenceChip(confidence: string, t: (k: string) => string) {
  const c = CONFIDENCE_CHIP[confidence] ?? CONFIDENCE_CHIP.none;
  return (
    <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0", c.className)}>
      {t(c.labelKey)}
    </span>
  );
}

function firstSource(sources: string | null): string | null {
  if (!sources) return null;
  return sources.split(" ; ")[0] || null;
}

export function DarbarsExplorer({
  initialDarbars,
  initialUrs,
  seed,
}: {
  initialDarbars?: PaginatedResponse<Darbar>;
  initialUrs?: PaginatedResponse<UrsDate>;
  seed: { q: string; province: string; page: number };
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<"shrines" | "urs">("shrines");

  // Shrines tab state
  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [province, setProvince] = useState(seed.province);
  const [page, setPage] = useState(seed.page);

  // Urs tab state
  const [ursQuery, setUrsQuery] = useState("");
  const [showUnresearched, setShowUnresearched] = useState(false);

  useEffect(() => {
    setQ(seed.q);
    setInput(seed.q);
    setProvince(seed.province);
    setPage(seed.page);
  }, [seed.q, seed.province, seed.page]);

  const seedMatch = page === seed.page && q === seed.q && province === seed.province;
  const { data, isLoading } = useDarbars(page, q, "", province, 24, seedMatch ? initialDarbars : undefined);
  const { data: ursData, isLoading: ursLoading } = useUrsDates(1, "", "", "", 100, initialUrs);

  const pushUrl = (next: { page: number; q?: string; province?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const nprov = next.province ?? province;
    if (nq) params.set("q", nq);
    if (nprov) params.set("province", nprov);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/darbars?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
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

  const ursAll = useMemo(() => ursData?.data ?? [], [ursData]);
  const upcoming = useMemo(
    () => ursAll.filter((u) => u.researched && u.upcomingOrder != null).sort((a, b) => (a.upcomingOrder ?? 0) - (b.upcomingOrder ?? 0)),
    [ursAll]
  );
  const researchedRest = useMemo(
    () => ursAll.filter((u) => u.researched && u.upcomingOrder == null),
    [ursAll]
  );
  const unverified = useMemo(() => ursAll.filter((u) => !u.researched), [ursAll]);

  const filteredUrs = useMemo(() => {
    const needle = ursQuery.trim().toLowerCase();
    const match = (u: { name: string; saint: string; city: string; nextExpected: string | null }) =>
      !needle ||
      u.name.toLowerCase().includes(needle) ||
      u.saint.toLowerCase().includes(needle) ||
      u.city.toLowerCase().includes(needle) ||
      (u.nextExpected ?? "").toLowerCase().includes(needle);
    return { upcoming: upcoming.filter(match), researchedRest: researchedRest.filter(match), unverified: unverified.filter(match) };
  }, [upcoming, researchedRest, unverified, ursQuery]);

  return (
    <div className="container-page py-10 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <Star size={14} className="text-amber-600" />
          <span>Sufi Heritage & Lunar Traditions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          {t("darbars.title")}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          {t("darbars.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab("shrines")}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer",
            tab === "shrines"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
        >
          <Sparkles size={15} />
          <span>{t("darbars.tabShrines")}</span>
        </button>

        <button
          onClick={() => setTab("urs")}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer",
            tab === "urs"
              ? "bg-amber-500 text-slate-950 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
          )}
        >
          <CalendarDays size={15} />
          <span>{t("darbars.tabUrs")}</span>
        </button>
      </div>

      {tab === "shrines" ? (
        <>
          {/* Disclaimer */}
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              {t("darbars.disclaimerPre")}
              <strong>{t("darbars.disclaimerStrong")}</strong>
              {t("darbars.disclaimerPost")}
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {PROVINCES.map((p) => (
                <button
                  key={p.value || "all"}
                  onClick={() => selectProvince(p.value)}
                  className={clsx(
                    "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                    province === p.value
                      ? "bg-brand-600 text-white shadow-xs font-semibold"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70"
                  )}
                >
                  {t(p.k)}
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
                  placeholder={t("darbars.searchPlaceholder")}
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  aria-label={t("darbars.searchAria")}
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

          {/* Results Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl text-center py-16 px-6 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                <Sparkles size={28} />
              </div>
              <p className="text-lg font-bold text-slate-900">{t("darbars.emptyTitle")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("directories.tryProvince")}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((darbar) => (
                <div
                  key={darbar.id}
                  className={clsx(
                    "group relative bg-white border border-slate-200/90 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4",
                    darbar.verified ? "border-l-emerald-500" : "border-l-amber-400"
                  )}
                >
                  <div>
                    {/* Top Region Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                        <MapPin size={11} className="text-amber-600" />
                        <span>{darbar.city} · {darbar.province}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {clean(darbar.ursDate) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CalendarDays size={11} /> {t("darbars.ursLabel")}: {darbar.ursDate}
                          </span>
                        )}
                        {darbar.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            <BadgeCheck size={11} aria-hidden /> {t("directories.verified")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shrine Title */}
                    <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight mb-2 group-hover:text-brand-700 transition-colors">
                      {darbar.name}
                    </h3>

                    {/* Saint & Era */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-brand-800 mb-3 bg-emerald-50/60 border border-emerald-100 rounded-lg px-2.5 py-1">
                      <User size={13} className="text-brand-600 shrink-0" />
                      <span className="truncate">
                        {darbar.saint}
                        {clean(darbar.saintDeathYear) && (
                          <span className="text-slate-500"> · {t("darbars.died")} {darbar.saintDeathYear}</span>
                        )}
                      </span>
                    </div>

                    {/* Address */}
                    {darbar.address && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {darbar.address}
                      </p>
                    )}

                    {/* Description */}
                    {darbar.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                        {darbar.description}
                      </p>
                    )}

                    {/* Timings */}
                    {clean(darbar.timings) && (
                      <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>{darbar.timings}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    {darbar.mapLink && (
                      <a
                        href={darbar.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-brand-600 hover:bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]"
                      >
                        <MapPin size={13} />
                        <span>{t("directories.openMaps")}</span>
                      </a>
                    )}
                    {darbar.sourceLink && (
                      <a
                        href={darbar.sourceLink}
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
              {t(data.pagination.total === 1 ? "darbars.listedOne" : "darbars.listedOther", {
                count: data.pagination.total,
              })}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Urs Calendar Tab */}
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t("darbars.ursDisclaimerStrong")}</strong>{" "}
              <em>{t("darbars.ursDisclaimerEm")}</em>
              {t("darbars.ursDisclaimerPost")}
            </p>
          </div>

          {/* Islamic Calendar Lunar Anchors Banner */}
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-950 via-brand-900 to-[#042019] text-white p-5 sm:p-6 border border-emerald-700/40 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Moon size={15} />
              <span>{t("darbars.anchorsLabel")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CALENDAR_ANCHORS.map((a) => (
                <div key={a.lk} className="p-3 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-xs text-amber-300 font-bold">{t(a.lk)}</p>
                  <p className="text-sm text-white font-medium mt-0.5">{t(a.dk)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search Filter */}
          <div className="mb-8 flex gap-3 max-w-md">
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus-within:border-brand-500 shadow-xs">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={ursQuery}
                onChange={(e) => setUrsQuery(e.target.value)}
                placeholder={t("darbars.ursPlaceholder")}
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                aria-label={t("darbars.ursAria")}
              />
            </div>
          </div>

          {ursLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            <>
              {/* Upcoming Urs in order */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CalendarDays size={20} className="text-brand-600" />
                  <span>{t("darbars.upcomingTitle")}</span>
                </h2>

                <div className="space-y-3">
                  {filteredUrs.upcoming.map((u) => (
                    <div
                      key={u.id}
                      className="group bg-white border border-slate-200/90 hover:border-brand-500/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-700 to-emerald-600 text-white text-base font-bold shrink-0 shadow-xs">
                        #{u.upcomingOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 text-base">{u.name}</p>
                          {confidenceChip(u.confidence, t)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {u.saint} · <span className="font-semibold text-slate-700">{u.city}</span>
                        </p>
                        {clean(u.ursRule) && (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-medium text-slate-500">{t("darbars.rule")}</span> {u.ursRule}
                          </p>
                        )}
                      </div>
                      <div className="sm:text-right shrink-0 bg-amber-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-amber-200/60 sm:border-0">
                        <span className="text-[10px] text-amber-800 uppercase font-bold block sm:hidden">Next Expected:</span>
                        <p className="text-sm font-bold text-brand-700 sm:text-base">
                          {u.nextExpected}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredUrs.upcoming.length === 0 && (
                    <p className="text-sm text-slate-500 py-6 text-center bg-white rounded-2xl border border-slate-200">{t("darbars.noUpcoming")}</p>
                  )}
                </div>
              </div>

              {/* Other Researched Dates */}
              {filteredUrs.researchedRest.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">{t("darbars.otherTitle")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredUrs.researchedRest.map((u) => (
                      <div key={u.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-slate-900 text-base">{u.name}</p>
                            {confidenceChip(u.confidence, t)}
                          </div>
                          <p className="text-xs text-slate-500 mb-2">
                            {u.saint}
                            {clean(u.saintDeathYear) && ` · ${t("darbars.died")} ${u.saintDeathYear}`} · {u.city}
                          </p>
                          {clean(u.ursRule) && (
                            <p className="text-xs text-slate-600 mb-1">
                              <strong>{t("darbars.rule")}</strong> {u.ursRule}
                            </p>
                          )}
                          {clean(u.nextExpected) && (
                            <p className="text-xs font-semibold text-brand-700 mb-1">
                              {t("darbars.nextExpected")} {u.nextExpected}
                            </p>
                          )}
                          {u.notes && (
                            <p className="text-xs italic text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                              {u.notes}
                            </p>
                          )}
                        </div>
                        {firstSource(u.sources) && (
                          <div className="pt-3 mt-3 border-t border-slate-100">
                            <a
                              href={firstSource(u.sources)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700"
                            >
                              <span>{t("directories.source")}</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not researched toggle */}
              <div className="mt-8">
                <button
                  onClick={() => setShowUnresearched((v) => !v)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-700 mb-4 p-2 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {showUnresearched ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span>{t("darbars.notResearched", { count: filteredUrs.unverified.length })}</span>
                </button>

                {showUnresearched && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUrs.unverified.map((u) => (
                      <div key={u.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                          {confidenceChip("none", t)}
                        </div>
                        <p className="text-xs text-slate-500">{u.saint} · {u.city}</p>
                        {u.howToConfirm && (
                          <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg">
                            {u.howToConfirm}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-slate-400 mt-10">
                {t("darbars.researchA", { count: ursAll.filter((u) => u.researched).length })} ·{" "}
                {t("darbars.researchB", { count: ursAll.filter((u) => !u.researched).length })} ·{" "}
                {t("darbars.researchC")}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
