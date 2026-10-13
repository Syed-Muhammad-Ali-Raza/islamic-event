"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, CalendarDays } from "lucide-react";
import { clsx } from "clsx";
import type { CitySummary } from "@/types";

const PROVINCE_ORDER = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Kashmir",
  "Gilgit-Baltistan",
  "Federally Administered Tribal Areas",
];

const byName = (a: CitySummary, b: CitySummary) => a.name.localeCompare(b.name);

export function CitiesExplorer({ cities }: { cities: CitySummary[] }) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");

  const provinceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cities) counts.set(c.state, (counts.get(c.state) ?? 0) + 1);
    return [...counts.entries()].sort(
      (a, b) =>
        (PROVINCE_ORDER.indexOf(a[0]) + 1 || 99) -
        (PROVINCE_ORDER.indexOf(b[0]) + 1 || 99)
    );
  }, [cities]);

  const featured = useMemo(
    () => cities.filter((c) => c.eventCount > 0).sort((a, b) => b.eventCount - a.eventCount).slice(0, 8),
    [cities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cities.filter(
      (c) =>
        (!province || c.state === province) &&
        (!q || c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
    );
  }, [cities, query, province]);

  const groups = useMemo(() => {
    const map = new Map<string, CitySummary[]>();
    for (const c of filtered) {
      const list = map.get(c.state);
      if (list) list.push(c);
      else map.set(c.state, [c]);
    }
    for (const list of map.values()) list.sort(byName);
    return [...map.entries()].sort(
      (a, b) =>
        (PROVINCE_ORDER.indexOf(a[0]) + 1 || 99) -
        (PROVINCE_ORDER.indexOf(b[0]) + 1 || 99)
    );
  }, [filtered]);

  const showFeatured = featured.length > 0 && !query && !province;

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-xl mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city — Lahore, Abbottabad, Gilgit…"
          aria-label="Search cities"
          className="input pl-10 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Province chips */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by province">
        <button
          onClick={() => setProvince("")}
          aria-pressed={province === ""}
          className={clsx(
            "badge transition-colors",
            province === ""
              ? "bg-brand-600 text-white border border-brand-600"
              : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          All <span className="opacity-70">{cities.length}</span>
        </button>
        {provinceCounts.map(([state, count]) => (
          <button
            key={state}
            onClick={() => setProvince(state === province ? "" : state)}
            aria-pressed={province === state}
            className={clsx(
              "badge transition-colors",
              province === state
                ? "bg-brand-600 text-white border border-brand-600"
                : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700"
            )}
          >
            {state} <span className="opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {/* Cities with events — only when unfiltered */}
      {showFeatured && (
        <section aria-label="Cities with events" className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Happening now</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.map((city) => (
              <Link
                key={city.id}
                href={`/cities/${city.slug}`}
                className="group card-glass px-4 py-3 hover:border-brand-600/50 transition-colors"
              >
                <p className="font-semibold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">
                  {city.name}
                </p>
                <p className="inline-flex items-center gap-1.5 text-brand-700 text-xs mt-1 font-medium">
                  <CalendarDays size={11} />
                  {city.eventCount} event{city.eventCount === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Directory index, grouped by province */}
      {groups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-600 font-medium">
            No cities match {query ? `“${query}”` : "this filter"}.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setProvince("");
            }}
            className="btn-ghost mt-3"
          >
            Clear filters
          </button>
        </div>
      ) : (
        groups.map(([state, list]) => (
          <section key={state} aria-labelledby={`province-${state}`} className="mb-8">
            <h2
              id={`province-${state}`}
              className="sticky top-16 z-10 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-brand-700"
            >
              {state} <span className="text-slate-400 font-normal normal-case tracking-normal">{list.length}</span>
            </h2>
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-x-8 pt-2">
              {list.map((city) => (
                <Link
                  key={city.id}
                  href={`/cities/${city.slug}`}
                  className="group flex items-center justify-between gap-2 break-inside-avoid py-1.5 text-sm text-slate-700 hover:text-brand-700 transition-colors"
                >
                  <span className="truncate">{city.name}</span>
                  {city.eventCount > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-1.5 py-px">
                      {city.eventCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <p className="text-xs text-slate-400 mt-4">
        Showing {filtered.length} of {cities.length} cities
      </p>
    </div>
  );
}
