"use client";

import { useState, useMemo } from "react";
import {
  Search, MapPin, ExternalLink, AlertTriangle, Sparkles, Clock, CalendarDays, User,
  BookOpen, ListOrdered, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { clsx } from "clsx";
import { useDarbars } from "@/hooks/useDarbars";
import { useUrsDates } from "@/hooks/useUrsDates";

const PROVINCES = [
  { value: "", label: "All provinces" },
  { value: "Punjab", label: "Punjab" },
  { value: "Sindh", label: "Sindh" },
  { value: "Khyber Pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
  { value: "Islamabad Capital Territory", label: "Islamabad (ICT)" },
  { value: "Azad Jammu & Kashmir", label: "Azad Jammu & Kashmir" },
];

const CALENDAR_ANCHORS = [
  { label: "1 Safar 1448", date: "Jul 16, 2026" },
  { label: "1 Rabi al-Awwal 1448", date: "Aug 15, 2026" },
  { label: "1 Ramadan 1448", date: "about Feb 9, 2027" },
];

const CONFIDENCE_CHIP: Record<string, { label: string; className: string }> = {
  high: { label: "High confidence", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium confidence", className: "bg-sky-100 text-sky-700" },
  low: { label: "Low confidence", className: "bg-amber-100 text-amber-700" },
  none: { label: "Not researched", className: "bg-slate-100 text-slate-500" },
};

const clean = (s: string | null | undefined) => (s && s !== "Uncertain" && s !== "Not verified" ? s : null);

function confidenceChip(confidence: string) {
  const c = CONFIDENCE_CHIP[confidence] ?? CONFIDENCE_CHIP.none;
  return (
    <span className={clsx("rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0", c.className)}>
      {c.label}
    </span>
  );
}

function firstSource(sources: string | null): string | null {
  if (!sources) return null;
  return sources.split(" ; ")[0] || null;
}

export default function DarbarsPage() {
  const [tab, setTab] = useState<"shrines" | "urs">("shrines");

  // Shrines tab state
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);

  // Urs tab state
  const [ursQuery, setUrsQuery] = useState("");
  const [showUnresearched, setShowUnresearched] = useState(false);

  const { data, isLoading } = useDarbars(page, q, "", province);
  const { data: ursData, isLoading: ursLoading } = useUrsDates(1, "", "", "", 100);

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
          <Sparkles size={26} className="text-brand-600" /> Darbars (Shrines)
        </h1>
        <p className="text-slate-500 text-sm">
          Sufi darbars &amp; shrines across Pakistan — with saints, death years and researched annual Urs dates
        </p>
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
          <BookOpen size={14} /> Shrines
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
          <ListOrdered size={14} /> Urs Calendar
        </button>
      </div>

      {tab === "shrines" ? (
        <>
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              Community-sourced list built from public encyclopaedia and heritage sources — Urs dates follow the
              Islamic lunar calendar and shift about 10-11 days earlier each year, and death years from traditional
              accounts may differ between sources. Please <strong>confirm locally</strong> before travelling and
              treat every shrine with respect. Know a darbar we&apos;re missing? Contact support.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select
              value={province}
              onChange={(e) => selectProvince(e.target.value)}
              className="input px-3 py-2 text-xs"
              aria-label="Filter by province"
            >
              {PROVINCES.map((p) => (
                <option key={p.value || "all"} value={p.value}>
                  {p.label}
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
                  placeholder="Search shrine, saint or city…"
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  aria-label="Search darbars"
                />
              </div>
              <button onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
                Search
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
              <p className="text-lg font-medium text-slate-900">No matching darbars</p>
              <p className="text-slate-500 text-sm mt-1">Try another province or clear your search.</p>
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
                      {clean(darbar.saintDeathYear) ? ` · d. ${darbar.saintDeathYear}` : ""}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {clean(darbar.ursDate) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                        <CalendarDays size={10} className="text-brand-600" /> Urs: {darbar.ursDate}
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
                        <MapPin size={12} /> Open in Google Maps
                      </a>
                    )}
                    {darbar.sourceLink && (
                      <a
                        href={darbar.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-700 transition-colors"
                      >
                        Source <ExternalLink size={10} />
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
                ← Previous
              </button>
              <span className="text-slate-500 text-sm">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}

          {data && (
            <p className="text-center text-xs text-slate-400 mt-6">
              {data.pagination.total} darbar{data.pagination.total === 1 ? "" : "s"} listed · built from public
              heritage sources
            </p>
          )}
        </>
      ) : (
        <>
          {/* Urs Calendar tab */}
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              <strong>Urs dates are announced by Auqaf departments or district administrations — always confirm a
              few days before travelling.</strong>{" "}
              <em>Next expected</em> dates are estimates from the lunar rule and can shift 1-2 days with moon
              sighting. Data prepared 10 Oct 2026 from public news and official sources.
            </p>
          </div>

          {/* Calendar anchors */}
          <div className="mb-6 card-glass p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2 inline-flex items-center gap-1.5">
              <Info size={13} className="text-brand-600" /> Pakistan calendar anchors (1448 AH)
            </p>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_ANCHORS.map((a) => (
                <span
                  key={a.label}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600"
                >
                  <strong className="text-slate-800">{a.label}</strong> ≈ {a.date}
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
                placeholder="Filter by shrine, saint, city or date…"
                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                aria-label="Filter Urs dates"
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
              <h2 className="text-lg font-bold text-slate-900 mb-3">Upcoming Urs (in order)</h2>
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
                        {confidenceChip(u.confidence)}
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
                  <p className="text-sm text-slate-500">No upcoming Urs matches your filter.</p>
                )}
              </div>

              {/* Other researched */}
              {filteredUrs.researchedRest.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Other researched dates</h2>
                  <div className="grid gap-3 sm:grid-cols-2 mb-10">
                    {filteredUrs.researchedRest.map((u) => (
                      <div key={u.id} className="card-glass p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm leading-snug">{u.name}</p>
                          {confidenceChip(u.confidence)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {u.saint}
                          {clean(u.saintDeathYear) ? ` · d. ${u.saintDeathYear}` : ""} · {u.city}
                        </p>
                        {clean(u.ursRule) && (
                          <p className="text-xs text-slate-600">Rule: {u.ursRule}</p>
                        )}
                        {clean(u.lastObserved) && (
                          <p className="text-xs text-slate-500">Last observed: {u.lastObserved}</p>
                        )}
                        {clean(u.nextExpected) && (
                          <p className="text-xs font-medium text-brand-700">Next expected: {u.nextExpected}</p>
                        )}
                        {u.calendarBasis && (
                          <p className="text-[11px] text-slate-400">Calendar: {u.calendarBasis}</p>
                        )}
                        {u.notes && <p className="text-[11px] italic text-slate-400">{u.notes}</p>}
                        {firstSource(u.sources) && (
                          <a
                            href={firstSource(u.sources)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-700 transition-colors"
                          >
                            Source <ExternalLink size={10} />
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
                Not yet researched ({filteredUrs.unverified.length})
              </button>
              {showUnresearched && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredUrs.unverified.map((u) => (
                    <div key={u.id} className="card-glass p-4 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-700 text-sm leading-snug">{u.name}</p>
                        {confidenceChip("none")}
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
                    <p className="text-sm text-slate-500">Nothing matches your filter.</p>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-slate-400 mt-8">
                {ursAll.filter((u) => u.researched).length} researched ·{" "}
                {ursAll.filter((u) => !u.researched).length} not yet researched · always confirm with local Auqaf /
                administration
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
