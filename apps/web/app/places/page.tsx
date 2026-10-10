"use client";

import { useState } from "react";
import { Search, MapPin, ExternalLink, AlertTriangle, Landmark, Clock, Ticket, Building2, Award } from "lucide-react";
import { clsx } from "clsx";
import { usePlaces } from "@/hooks/usePlaces";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "Historical", label: "Historical" },
  { value: "Religious", label: "Religious" },
  { value: "Cultural", label: "Cultural" },
  { value: "Natural / Tourist", label: "Natural" },
];

const PROVINCES = [
  { value: "", label: "All provinces" },
  { value: "Punjab", label: "Punjab" },
  { value: "Sindh", label: "Sindh" },
  { value: "Khyber Pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
  { value: "Islamabad Capital Territory", label: "Islamabad (ICT)" },
];

const clean = (s: string | null | undefined) => (s && s !== "N/A" ? s : null);

function unescoBadge(status: string | null) {
  if (!status || status === "Not inscribed") return null;
  if (status.startsWith("UNESCO World Heritage")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <Award size={10} /> UNESCO World Heritage
      </span>
    );
  }
  if (status.includes("Tentative")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
        <Award size={10} /> UNESCO Tentative
      </span>
    );
  }
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{status}</span>
  );
}

export default function PlacesPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePlaces(page, q, category, province);

  const applySearch = () => {
    setPage(1);
    setQ(input);
  };

  const selectCategory = (c: string) => {
    setPage(1);
    setCategory(c);
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Landmark size={26} className="text-brand-600" /> Pakistan Places
        </h1>
        <p className="text-slate-500 text-sm">
          Historical, religious, cultural and natural places across Pakistan — forts, shrines, museums, valleys &amp;
          more
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
        <p>
          Community-sourced list built from public encyclopaedia and heritage sources — timings and tickets are{" "}
          <strong>general guidance only</strong>. Please confirm locally before travelling and respect every site.
          Know a place we&apos;re missing? Contact support.
        </p>
      </div>

      {/* Category tabs + province + search */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value || "all"}
                onClick={() => selectCategory(c.value)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  category === c.value
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={province}
            onChange={(e) => selectProvince(e.target.value)}
            className="ml-auto input px-3 py-2 text-xs"
            aria-label="Filter by province"
          >
            {PROVINCES.map((p) => (
              <option key={p.value || "all"} value={p.value}>
                {p.label}
              </option>
            ))}
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
              placeholder="Search name, type, city or description…"
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label="Search places"
            />
          </div>
          <button onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">🏛️</p>
          <p className="text-lg font-medium text-slate-900">No matching places</p>
          <p className="text-slate-500 text-sm mt-1">Try another category, province or clear your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((place) => (
            <div key={place.id} className="card-glass p-5 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 leading-snug">{place.name}</h3>
                {unescoBadge(place.unescoStatus)}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="badge-brand text-[10px]">{place.type}</span>
                <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {place.city} · {place.province}
                </span>
              </div>

              {place.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{place.description}</p>
              )}

              {clean(place.builtYear) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Building2 size={12} className="text-brand-600 shrink-0 mt-0.5" />
                  <span>
                    Built: {place.builtYear}
                    {clean(place.builtBuilder) ? ` — ${place.builtBuilder}` : ""}
                  </span>
                </p>
              )}

              {clean(place.timings) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Clock size={12} className="text-brand-600 shrink-0 mt-0.5" /> {place.timings}
                </p>
              )}

              {clean(place.ticket) && (
                <p className="inline-flex items-start gap-1.5 text-xs text-slate-500">
                  <Ticket size={12} className="text-brand-600 shrink-0 mt-0.5" /> {place.ticket}
                </p>
              )}

              <div className="mt-auto pt-2 flex items-center gap-2">
                {place.mapLink && (
                  <a
                    href={place.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>
                )}
                {place.sourceLink && (
                  <a
                    href={place.sourceLink}
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
          {data.pagination.total} place{data.pagination.total === 1 ? "" : "s"} listed · built from public heritage
          sources
        </p>
      )}
    </div>
  );
}
