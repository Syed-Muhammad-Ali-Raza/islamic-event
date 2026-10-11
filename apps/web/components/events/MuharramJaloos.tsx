"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { useProcessions } from "@/hooks/useProcessions";
import type { PaginatedResponse, Procession } from "@/types";

const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  procession: { label: "Procession", cls: "bg-rose-50 text-rose-700 border border-rose-200" },
  road_closure: { label: "Road Closure", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  summary: { label: "Overview", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
};

const CITIES = ["All", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan"];
const MONTHS = ["", "Muharram", "Safar"];

function dayLabel(day: string) {
  if (day === "1-10") return "1st – 10th Muharram";
  const suffix =
    day === "1" ? "st" : day === "2" ? "nd" : day === "3" ? "rd" : "th";
  return `${day}${suffix} Muharram`;
}

function ProcessionCard({ p }: { p: Procession }) {
  const [open, setOpen] = useState(false);
  const badge = KIND_BADGE[p.kind] ?? KIND_BADGE.procession;
  const highlights = p.routeHighlights?.split("\n").filter(Boolean) ?? [];
  const longDesc = (p.description?.length ?? 0) > 280;

  return (
    <div className="card-glass p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h4 className="font-semibold text-slate-900 leading-snug">{p.name}</h4>
          {p.type && <p className="text-xs text-brand-700 font-medium mt-0.5">{p.type}</p>}
        </div>
        <span className={`badge border text-[10px] px-2 py-0.5 whitespace-nowrap ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {(p.start || p.end) && (
        <p className="text-sm text-slate-600 mb-1">
          <span className="text-slate-400">Start:</span> {p.start ?? "—"}
          {p.end && (
            <>
              {" "}
              <span className="text-slate-400">→ End:</span> {p.end}
            </>
          )}
        </p>
      )}
      {p.time && (
        <p className="text-sm text-slate-600 mb-1">
          <span className="text-slate-400">Time:</span> {p.time}
        </p>
      )}

      {p.route && (
        <div className="text-sm text-slate-700 mb-2">
          <span className="text-slate-400">Route / closures:</span>
          <ul className="mt-1 space-y-0.5">
            {p.route.split("\n").filter(Boolean).map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="text-sm text-slate-700 mb-2">
          <span className="text-slate-400">Route highlights:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {highlights.map((h) => (
              <span key={h} className="badge-brand text-[10px] px-2 py-0.5">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {p.description && (
        <div className="mt-2">
          <p
            className={`text-sm text-slate-600 leading-relaxed ${
              !open && longDesc ? "line-clamp-3" : ""
            }`}
          >
            {p.description}
          </p>
          {longDesc && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-xs text-brand-700 font-medium mt-1 hover:underline"
            >
              {open ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {p.notes && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-3">
          {p.notes}
        </p>
      )}

      {p.googleMaps && (
        <a
          href={p.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium mt-3 hover:underline"
        >
          📍 Open starting point on Google Maps
        </a>
      )}
    </div>
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
  const { data, isLoading } = useProcessions(page, q, apiCity, month, 24, seedMatch ? initialData : undefined);

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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">🕯️ Muharram Jaloos (Processions)</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl mx-auto">
          Traditional procession routes, timings and road closures for Muharram &amp; Safar
          across major cities. Routes may change every year — always confirm locally.
        </p>
      </div>

      {/* Controls: city tabs + month + search */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCity(c)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  city === c
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <select
            value={month}
            onChange={(e) => selectMonth(e.target.value)}
            className="ml-auto input w-auto px-3 py-2 text-xs"
            aria-label="Filter by month"
          >
            <option value="">All months</option>
            <option value="Muharram">Muharram</option>
            <option value="Safar">Safar</option>
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
              placeholder="Search processions…"
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label="Search processions"
            />
          </div>
          <button type="button" onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">🕯️</p>
          <p className="text-lg font-medium text-slate-900">No processions match your filters</p>
          <p className="text-slate-500 text-sm mt-1">
            Try a different city, month or search term.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([key, groupItems]) => {
            const [cityName, monthName] = key.split("|");
            const processionsOnly = groupItems.filter((p) => p.kind === "procession");
            const others = groupItems.filter((p) => p.kind !== "procession");
            const days = Array.from(
              new Set(processionsOnly.map((p) => p.day))
            ).sort((a, b) => {
              const na = parseInt(a, 10);
              const nb = parseInt(b, 10);
              if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
              return a.localeCompare(b);
            });

            return (
              <div key={key}>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-brand-500 rounded-full" />
                  {cityName} — {monthName}
                </h3>

                {days.map((day) => (
                  <div key={day} className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      {dayLabel(day)}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {processionsOnly
                        .filter((p) => p.day === day)
                        .map((p) => (
                          <ProcessionCard key={p.id} p={p} />
                        ))}
                    </div>
                  </div>
                ))}

                {others.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Closures &amp; overview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {others.map((p) => (
                        <ProcessionCard key={p.id} p={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => gotoPage(page - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">
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

      <p className="text-xs text-slate-400 text-center mt-8 max-w-2xl mx-auto">
        Disclaimer: procession dates and routes are subject to local moon sighting and
        administration decisions. Google Maps links point to starting-point names only.
        Data compiled from official traffic advisories and police reports.
      </p>
    </section>
  );
}
