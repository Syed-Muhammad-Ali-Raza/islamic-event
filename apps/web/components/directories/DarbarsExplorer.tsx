"use client";

import { useState, useMemo } from "react";
import {
  Search, MapPin, ExternalLink, AlertTriangle, Sparkles, Clock, CalendarDays, User,
  BookOpen, ListOrdered, ChevronDown, ChevronUp, Info,
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
  high: { labelKey: "darbars.confHigh", className: "bg-emerald-100 text-emerald-700" },
  medium: { labelKey: "darbars.confMedium", className: "bg-sky-100 text-sky-700" },
  low: { labelKey: "darbars.confLow", className: "bg-amber-100 text-amber-700" },
  none: { labelKey: "darbars.confNone", className: "bg-slate-100 text-slate-500" },
};

const clean = (s: string | null | undefined) => (s && s !== "Uncertain" && s !== "Not verified" ? s : null);

function confidenceChip(confidence: string, t: (k: string) => string) {
  const c = CONFIDENCE_CHIP[confidence] ?? CONFIDENCE_CHIP.none;
  return (
    <span className={clsx("rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0", c.className)}>
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
}: {
  initialDarbars?: PaginatedResponse<Darbar>;
  initialUrs?: PaginatedResponse<UrsDate>;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"shrines" | "urs">("shrines");

  // Shrines tab state
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);

  // Urs tab state
  const [ursQuery, setUrsQuery] = useState("");
  const [showUnresearched, setShowUnresearched] = useState(false);

  const { data, isLoading } = useDarbars(page, q, "", province, 24, initialDarbars);
  const { data: ursData, isLoading: ursLoading } = useUrsDates(1, "", "", "", 100, initialUrs);

  const applySearch = () => {
    setPage(1);
    setQ(input);
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
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
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Sparkles size={26} className="text-brand-600" /> {t("darbars.title")}
        </h1>
        <p className="text-slate-500 text-sm">{t("darbars.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5">
        <button
          onClick={() => setTab("shrines")}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5",
            tab === "shrines"
              ? "bg-brand-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          <BookOpen size={14} /> {t("darbars.tabShrines")}
        </button>
        <button
          onClick={() => setTab("urs")}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5",
            tab === "urs"
              ? "bg-brand-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          <ListOrdered size={14} /> {t("darbars.tabUrs")}
        </button>
      </div>

      {tab === "shrines" ? (
        <>
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              {t("darbars.disclaimerPre")}
              <strong>{t("darbars.disclaimerStrong")}</strong>
              {t("darbars.disclaimerPost")}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select
              value={province}
              onChange={(e) => selectProvince(e.target.value)}
              className="input px-3 py-2 text-xs"
              aria-label={t("directories.filterProvince")}
            >
              {PROVINCES.map((p) => (
                <option key={p.value || "all"} value={p.value}>
                  {t(p.k)}
                </option>
              ))}
            </select>

            <div className="flex gap-3 ml-auto w-full sm:w-auto max-w-sm">
              <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
                <Search size={15} className="text-brand-600 shrink-0" />
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
              <button onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
                {t("directories.search")}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="card-glass text-center py-16 px-6">
              <p className="text-5xl mb-4">🕯️</p>
              <p className="text-lg font-medium text-slate-900">{t("darbars.emptyTitle")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("directories.tryProvince")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((darbar) => (
                <div key={darbar.id} className="card-glass p-5 flex flex-col gap-2.5">
                  <h3 className="font-semibold text-slate-900 leading-snug">{darbar.name}</h3>

                  <p className="inline-flex items-start gap-1.5 text-xs text-slate-600">
                    <User size={12} className="text-brand-600 shrink-0 mt-0.5" />
                    <span>
                      {darbar.saint}
                      {clean(darbar.saintDeathYear) ? ` · ${t("darbars.died")} ${darbar.saintDeathYear}` : ""}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {clean(darbar.ursDate) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                        <CalendarDays size={10} className="text-brand-600" /> {t("darbars.ursLabel")}: {darbar.ursDate}
                      </span>
                    )}
                    <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {darbar.city} · {darbar.province}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{darbar.address}</p>

                  {darbar.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">{darbar.description}</p>
                  )}

                  {clean(darbar.timings) && (
                    <p className="inline-flex items-start gap-1.5 text-[11px] text-slate-400">
                      <Clock size={11} className="shrink-0 mt-0.5" /> {darbar.timings}
                    </p>
                  )}

                  <div className="mt-auto pt-2 flex items-center gap-2">
                    {darbar.mapLink && (
                      <a
                        href={darbar.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                      >
                        <MapPin size={12} /> {t("directories.openMaps")}
                      </a>
                    )}
                    {darbar.sourceLink && (
                      <a
                        href={darbar.sourceLink}
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
              {t(data.pagination.total === 1 ? "darbars.listedOne" : "darbars.listedOther", {
                count: data.pagination.total,
              })}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Urs Calendar tab */}
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              <strong>{t("darbars.ursDisclaimerStrong")}</strong>{" "}
              <em>{t("darbars.ursDisclaimerEm")}</em>
              {t("darbars.ursDisclaimerPost")}
            </p>
          </div>

          {/* Calendar anchors */}
          <div className="mb-6 card-glass p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2 inline-flex items-center gap-1.5">
              <Info size={13} className="text-brand-600" /> {t("darbars.anchorsLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_ANCHORS.map((a) => (
                <span
                  key={a.lk}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600"
                >
                  <strong className="text-slate-800">{t(a.lk)}</strong> ≈ {t(a.dk)}
                </span>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex gap-3 w-full sm:w-auto max-w-sm">
            <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
              <Search size={15} className="text-brand-600 shrink-0" />
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
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <h2 className="text-lg font-bold text-slate-900 mb-3">{t("darbars.upcomingTitle")}</h2>
              <div className="space-y-2.5 mb-10">
                {filteredUrs.upcoming.map((u) => (
                  <div
                    key={u.id}
                    className="card-glass p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-600 text-white text-sm font-bold shrink-0">
                      {u.upcomingOrder}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                        {confidenceChip(u.confidence, t)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {u.saint} · {u.city}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-brand-700 sm:text-right sm:max-w-[240px]">
                      {u.nextExpected}
                    </p>
                  </div>
                ))}
                {filteredUrs.upcoming.length === 0 && (
                  <p className="text-sm text-slate-500">{t("darbars.noUpcoming")}</p>
                )}
              </div>

              {/* Other researched */}
              {filteredUrs.researchedRest.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">{t("darbars.otherTitle")}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 mb-10">
                    {filteredUrs.researchedRest.map((u) => (
                      <div key={u.id} className="card-glass p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm leading-snug">{u.name}</p>
                          {confidenceChip(u.confidence, t)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {u.saint}
                          {clean(u.saintDeathYear) ? ` · ${t("darbars.died")} ${u.saintDeathYear}` : ""} · {u.city}
                        </p>
                        {clean(u.ursRule) && (
                          <p className="text-xs text-slate-600">{t("darbars.rule")} {u.ursRule}</p>
                        )}
                        {clean(u.lastObserved) && (
                          <p className="text-xs text-slate-500">{t("darbars.lastObserved")} {u.lastObserved}</p>
                        )}
                        {clean(u.nextExpected) && (
                          <p className="text-xs font-medium text-brand-700">{t("darbars.nextExpected")} {u.nextExpected}</p>
                        )}
                        {u.calendarBasis && (
                          <p className="text-[11px] text-slate-400">{t("darbars.calendar")} {u.calendarBasis}</p>
                        )}
                        {u.notes && <p className="text-[11px] italic text-slate-400">{u.notes}</p>}
                        {firstSource(u.sources) && (
                          <a
                            href={firstSource(u.sources)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-700 transition-colors"
                          >
                        {t("directories.source")} <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Not researched */}
              <button
                onClick={() => setShowUnresearched((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700 mb-3"
              >
                {showUnresearched ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {t("darbars.notResearched", { count: filteredUrs.unverified.length })}
              </button>
              {showUnresearched && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredUrs.unverified.map((u) => (
                    <div key={u.id} className="card-glass p-4 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-700 text-sm leading-snug">{u.name}</p>
                        {confidenceChip("none", t)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {u.saint} · {u.city}
                      </p>
                      {u.howToConfirm && (
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{u.howToConfirm}</p>
                      )}
                    </div>
                  ))}
                  {filteredUrs.unverified.length === 0 && (
                    <p className="text-sm text-slate-500">{t("darbars.nothingMatches")}</p>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-slate-400 mt-8">
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
