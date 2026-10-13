"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, ChevronDown, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { useProcessions } from "@/hooks/useProcessions";
import type { PaginatedResponse, Procession } from "@/types";

const KIND_META: Record<
  string,
  { label: string; rule: string; chip: string; dot: string }
> = {
  procession: {
    label: "Procession",
    rule: "border-l-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  road_closure: {
    label: "Road closure",
    rule: "border-l-amber-400",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  summary: {
    label: "Overview",
    rule: "border-l-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const CITIES = ["All", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan"];
const MONTHS: { value: string; label: string }[] = [
  { value: "", label: "All months" },
  { value: "Muharram", label: "Muharram" },
  { value: "Safar", label: "Safar" },
];

function dayLabel(day: string) {
  if (day === "1-10") return "1st – 10th Muharram";
  const suffix = day === "1" ? "st" : day === "2" ? "nd" : day === "3" ? "rd" : "th";
  return `${day}${suffix} Muharram`;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

function ProcessionCard({ p }: { p: Procession }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[p.kind] ?? KIND_META.procession;
  const highlights = p.routeHighlights?.split("\n").filter(Boolean) ?? [];
  const routeLines = p.route?.split("\n").filter(Boolean) ?? [];
  const longDesc = (p.description?.length ?? 0) > 280;

  return (
    <article
      className={clsx(
        "group relative bg-white border border-slate-200/90 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col border-l-4",
        meta.rule
      )}
    >
      {/* Title row */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 text-lg leading-snug tracking-tight group-hover:text-brand-700 transition-colors">
            {p.name}
          </h4>
          {p.type && <p className="mt-1 text-xs font-semibold text-brand-700">{p.type}</p>}
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            meta.chip
          )}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </header>

      {p.time && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={12} className="text-slate-400 shrink-0" aria-hidden />
          {p.time}
        </p>
      )}

      {/* Start → end drawn as a connected line */}
      {(p.start || p.end) && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <ol className="relative space-y-3 text-sm text-slate-900">
            {p.start && p.end && (
              <span
                aria-hidden
                className="absolute left-[5px] top-2 bottom-2 w-px bg-brand-600/40"
              />
            )}
            {p.start && (
              <li className="relative flex gap-3">
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-brand-600 bg-white" />
                <div>
                  <p className="text-xs text-slate-500">Starting point</p>
                  <p className="font-medium text-sm">{p.start}</p>
                </div>
              </li>
            )}
            {p.end && (
              <li className="relative flex gap-3">
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full bg-rose-500" />
                <div>
                  <p className="text-xs text-slate-500">Culmination</p>
                  <p className="font-medium text-sm">{p.end}</p>
                </div>
              </li>
            )}
          </ol>
        </div>
      )}

      {routeLines.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
            Route and key intersections
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
            {routeLines.map((r, i) => (
              <li key={i} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-rose-500"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
            Route highlights
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {p.description && (
        <div className="mt-4 text-xs leading-relaxed text-slate-600">
          <p className={!open && longDesc ? "line-clamp-3" : ""}>{p.description}</p>
          {longDesc && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className={clsx(
                "mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-700 hover:underline rounded",
                focusRing
              )}
            >
              {open ? "Show less" : "Read more"}
              <ChevronDown
                size={13}
                className={clsx("transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          )}
        </div>
      )}

      {p.notes && (
        <p className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 shadow-xs">
          {p.notes}
        </p>
      )}

      {p.googleMaps && (
        <div className="mt-auto pt-5">
          <a
            href={p.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98]",
              focusRing
            )}
          >
            <MapPin size={13} aria-hidden />
            Open starting point in Google Maps
          </a>
        </div>
      )}
    </article>
  );
}

export function MuharramJaloos({
  initialData,
  seed,
  currentQuery,
}: {
  initialData?: PaginatedResponse<Procession>;
  seed: { q: string; city: string; month: string; page: number };
  currentQuery: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [city, setCity] = useState(seed.city === "" ? "All" : seed.city);
  const [month, setMonth] = useState(seed.month);
  const [page, setPage] = useState(seed.page);

  useEffect(() => {
    setInput(seed.q);
    setQ(seed.q);
    setCity(seed.city === "" ? "All" : seed.city);
    setMonth(seed.month);
    setPage(seed.page);
  }, [seed.q, seed.city, seed.month, seed.page]);

  const apiCity = city === "All" ? "" : city;
  const seedMatch =
    page === seed.page &&
    q === seed.q &&
    apiCity === seed.city &&
    month === seed.month;
  const { data, isLoading } = useProcessions(
    page,
    q,
    apiCity,
    month,
    24,
    seedMatch ? initialData : undefined
  );

  const pushUrl = (next: { page: number; q?: string; city?: string; month?: string }) => {
    const params = new URLSearchParams(currentQuery);
    const nq = next.q ?? q;
    const ncity = next.city ?? apiCity;
    const nmonth = next.month ?? month;
    if (nq) params.set("pq", nq);
    else params.delete("pq");
    if (ncity) params.set("pcity", ncity);
    else params.delete("pcity");
    if (nmonth) params.set("pmonth", nmonth);
    else params.delete("pmonth");
    if (next.page > 1) params.set("ppage", String(next.page));
    else params.delete("ppage");
    router.push(`/categories/muharram?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
  };

  const selectCity = (c: string) => {
    setPage(1);
    setCity(c);
    pushUrl({ page: 1, city: c === "All" ? "" : c });
  };

  const selectMonth = (m: string) => {
    setPage(1);
    setMonth(m);
    pushUrl({ page: 1, month: m });
  };

  const gotoPage = (p: number) => {
    setPage(p);
    pushUrl({ page: p });
  };

  const items = useMemo(() => data?.data ?? [], [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, Procession[]>();
    for (const p of items) {
      const key = `${p.city}|${p.month}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const [cityA, monthA] = a[0].split("|");
      const [cityB, monthB] = b[0].split("|");
      if (cityA !== cityB) return cityA.localeCompare(cityB);
      return monthA === monthB ? 0 : monthA === "Muharram" ? -1 : 1;
    });
  }, [items]);

  return (
    <section className="mt-12" id="jaloos">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <AlertTriangle size={14} className="text-rose-600" />
          <span>Muharram & Safar Processions</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Muharram jaloos
        </h2>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          Procession routes, timings and road closures for Muharram and Safar in major
          cities. Routes can change every year, so confirm locally before you travel.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 shadow-xs">
        <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />
        <p className="leading-relaxed">
          Dates and routes depend on moon sighting and local administration decisions.
          Google Maps links point to starting-point names only. Data is compiled from
          official traffic advisories and police reports.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* City tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => selectCity(c)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                  focusRing,
                  city === c
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Month segmented control */}
          <div className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            {MONTHS.map((m) => (
              <button
                key={m.value || "all"}
                onClick={() => selectMonth(m.value)}
                className={clsx(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                  focusRing,
                  month === m.value
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Search size={16} className="text-slate-400 shrink-0" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search by name, route or place"
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label="Search processions"
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
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-16 px-6 shadow-xs">
          <p className="text-lg font-bold text-slate-900">No processions match these filters</p>
          <p className="text-slate-500 text-sm mt-1 mx-auto max-w-sm">
            Try another city or month, or clear the search to see everything.
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          {grouped.map(([key, groupItems]) => {
            const [cityName, monthName] = key.split("|");
            const processionsOnly = groupItems.filter((p) => p.kind === "procession");
            const others = groupItems.filter((p) => p.kind !== "procession");
            const days = Array.from(new Set(processionsOnly.map((p) => p.day))).sort(
              (a, b) => {
                const na = parseInt(a, 10);
                const nb = parseInt(b, 10);
                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                return a.localeCompare(b);
              }
            );

            return (
              <div key={key}>
                <div className="mb-6 flex items-baseline gap-3 border-b-2 border-slate-900 pb-2">
                  <h3 className="text-2xl font-bold text-slate-900">{cityName}</h3>
                  <span className="text-base text-slate-500">{monthName}</span>
                </div>

                <div className="space-y-10">
                  {days.map((day) => (
                    <div key={day} className="grid gap-4 md:grid-cols-[150px_1fr] md:gap-8">
                      <h4 className="text-lg font-bold text-rose-700 md:sticky md:top-4 md:self-start">
                        {dayLabel(day)}
                      </h4>
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {processionsOnly
                          .filter((p) => p.day === day)
                          .map((p) => (
                            <ProcessionCard key={p.id} p={p} />
                          ))}
                      </div>
                    </div>
                  ))}

                  {others.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-[150px_1fr] md:gap-8">
                      <h4 className="text-lg font-bold text-amber-700 md:sticky md:top-4 md:self-start">
                        Closures and overview
                      </h4>
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {others.map((p) => (
                          <ProcessionCard key={p.id} p={p} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => gotoPage(page - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm font-medium">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page === data.pagination.totalPages}
            onClick={() => gotoPage(page + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
