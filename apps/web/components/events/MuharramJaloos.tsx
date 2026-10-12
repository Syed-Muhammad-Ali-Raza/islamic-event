"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useProcessions } from "@/hooks/useProcessions";
import type { PaginatedResponse, Procession } from "@/types";

/*
  Design tokens (self-contained, no custom Tailwind theme needed)
  ink     #17211D   text
  alam    #1F5C46   primary (green of the alam flags)
  azadar  #7A2530   procession accent (deep crimson)
  closure #A8660F   road closure accent (amber)
  mist    #EEF2EF   panels
  line    #D5DDD8   borders
*/

const KIND_META: Record<
  string,
  { label: string; rule: string; chip: string; dot: string }
> = {
  procession: {
    label: "Procession",
    rule: "border-l-[#7A2530]",
    chip: "text-[#7A2530] bg-[#7A2530]/[0.07]",
    dot: "bg-[#7A2530]",
  },
  road_closure: {
    label: "Road closure",
    rule: "border-l-[#A8660F]",
    chip: "text-[#8A520A] bg-[#A8660F]/10",
    dot: "bg-[#A8660F]",
  },
  summary: {
    label: "Overview",
    rule: "border-l-[#1F5C46]",
    chip: "text-[#1F5C46] bg-[#1F5C46]/[0.08]",
    dot: "bg-[#1F5C46]",
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

function ProcessionCard({ p }: { p: Procession }) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[p.kind] ?? KIND_META.procession;
  const highlights = p.routeHighlights?.split("\n").filter(Boolean) ?? [];
  const routeLines = p.route?.split("\n").filter(Boolean) ?? [];
  const longDesc = (p.description?.length ?? 0) > 280;

  return (
    <article
      className={clsx(
        "bg-white rounded-lg border border-[#D5DDD8] border-l-4 p-5 sm:p-6 flex flex-col",
        meta.rule
      )}
    >
      {/* Title row */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-serif text-lg font-semibold leading-snug text-[#17211D]">
            {p.name}
          </h4>
          {p.type && <p className="mt-0.5 text-sm text-[#1F5C46]">{p.type}</p>}
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            meta.chip
          )}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </header>

      {p.time && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#44524B]">
          <Clock size={14} className="text-[#1F5C46]" aria-hidden />
          {p.time}
        </p>
      )}

      {/* Start → end drawn as a connected line */}
      {(p.start || p.end) && (
        <div className="mt-4 rounded-md bg-[#EEF2EF] px-4 py-3">
          <ol className="relative space-y-3 text-sm text-[#17211D]">
            {p.start && p.end && (
              <span
                aria-hidden
                className="absolute left-[5px] top-2 bottom-2 w-px bg-[#1F5C46]/40"
              />
            )}
            {p.start && (
              <li className="relative flex gap-3">
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[#1F5C46] bg-white" />
                <div>
                  <p className="text-xs text-[#5B6962]">Starting point</p>
                  <p className="font-medium">{p.start}</p>
                </div>
              </li>
            )}
            {p.end && (
              <li className="relative flex gap-3">
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full bg-[#7A2530]" />
                <div>
                  <p className="text-xs text-[#5B6962]">Culmination</p>
                  <p className="font-medium">{p.end}</p>
                </div>
              </li>
            )}
          </ol>
        </div>
      )}

      {routeLines.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-medium text-[#17211D]">Route and key intersections</p>
          <ul className="mt-2 space-y-1.5 text-[#44524B]">
            {routeLines.map((r, i) => (
              <li key={i} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#7A2530]"
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-medium text-[#17211D]">Route highlights</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h}
                className="rounded-md bg-[#1F5C46]/[0.08] px-2.5 py-1 text-xs font-medium text-[#1F5C46]"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {p.description && (
        <div className="mt-4 text-sm leading-relaxed text-[#44524B]">
          <p className={!open && longDesc ? "line-clamp-3" : ""}>{p.description}</p>
          {longDesc && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#1F5C46] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5C46] rounded"
            >
              {open ? "Show less" : "Read more"}
              <ChevronDown
                size={14}
                className={clsx("transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          )}
        </div>
      )}

      {p.notes && (
        <p className="mt-4 rounded-md border-l-2 border-[#A8660F] bg-[#A8660F]/[0.08] px-3.5 py-2.5 text-sm text-[#5E3A06]">
          {p.notes}
        </p>
      )}

      {p.googleMaps && (
        <div className="mt-auto pt-5">
          <a
            href={p.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[#1F5C46] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#184a39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5C46]"
          >
            <MapPin size={15} aria-hidden />
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

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F5C46]";

  return (
    <section className="mt-12 text-[#17211D]" id="jaloos">
      {/* Header */}
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Muharram jaloos
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#44524B]">
          Procession routes, timings and road closures for Muharram and Safar in major
          cities. Routes can change every year, so confirm locally before you travel.
        </p>
      </div>

      {/* Controls */}
      <div className="mt-8 space-y-4 border-y border-[#D5DDD8] py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* City tabs */}
          <div
            role="tablist"
            aria-label="Filter by city"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0"
          >
            {CITIES.map((c) => {
              const active = city === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectCity(c)}
                  className={clsx(
                    "shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                    focusRing,
                    active
                      ? "bg-[#17211D] text-white"
                      : "text-[#44524B] hover:bg-[#EEF2EF] hover:text-[#17211D]"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Month segmented control */}
          <div
            role="group"
            aria-label="Filter by month"
            className="inline-flex self-start rounded-md border border-[#D5DDD8] bg-white p-0.5"
          >
            {MONTHS.map((m) => {
              const active = month === m.value;
              return (
                <button
                  key={m.value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectMonth(m.value)}
                  className={clsx(
                    "cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    focusRing,
                    active
                      ? "bg-[#1F5C46] text-white"
                      : "text-[#44524B] hover:text-[#17211D]"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="flex max-w-md gap-2">
          <label className="flex flex-1 items-center gap-2.5 rounded-md border border-[#C3CEC8] bg-white px-3.5 py-2.5 focus-within:border-[#1F5C46] focus-within:ring-2 focus-within:ring-[#1F5C46]/20">
            <Search size={16} className="shrink-0 text-[#1F5C46]" aria-hidden />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search by name, route or place"
              className="flex-1 bg-transparent text-sm text-[#17211D] placeholder-[#7B8882] focus:outline-none"
              aria-label="Search processions"
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
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-full animate-pulse rounded-lg border border-[#D5DDD8] bg-[#EEF2EF]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#C3CEC8] bg-[#EEF2EF]/60 px-6 py-14 text-center">
            <p className="font-serif text-xl font-semibold">No processions match these filters</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#44524B]">
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
                  <div className="mb-6 flex items-baseline gap-3 border-b-2 border-[#17211D] pb-2">
                    <h3 className="font-serif text-2xl font-semibold">{cityName}</h3>
                    <span className="text-base text-[#5B6962]">{monthName}</span>
                  </div>

                  <div className="space-y-10">
                    {days.map((day) => (
                      <div key={day} className="grid gap-4 md:grid-cols-[150px_1fr] md:gap-8">
                        <h4 className="font-serif text-lg font-semibold text-[#7A2530] md:sticky md:top-4 md:self-start">
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
                        <h4 className="font-serif text-lg font-semibold text-[#A8660F] md:sticky md:top-4 md:self-start">
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
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-between border-t border-[#D5DDD8] pt-5"
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => gotoPage(page - 1)}
            className={clsx(
              "cursor-pointer rounded-md border border-[#C3CEC8] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[#1F5C46] hover:text-[#1F5C46] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#C3CEC8] disabled:hover:text-inherit",
              focusRing
            )}
          >
            ← Previous
          </button>
          <span className="text-sm text-[#5B6962]">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page === data.pagination.totalPages}
            onClick={() => gotoPage(page + 1)}
            className={clsx(
              "cursor-pointer rounded-md border border-[#C3CEC8] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[#1F5C46] hover:text-[#1F5C46] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#C3CEC8] disabled:hover:text-inherit",
              focusRing
            )}
          >
            Next →
          </button>
        </nav>
      )}

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-[#6C7973]">
        Dates and routes depend on moon sighting and local administration decisions. Google Maps
        links point to starting-point names only. Data is compiled from official traffic
        advisories and police reports.
      </p>
    </section>
  );
}