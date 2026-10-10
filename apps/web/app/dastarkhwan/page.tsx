"use client";

import { useState } from "react";
import { Search, MapPin, Clock, ExternalLink, BadgeCheck, AlertTriangle, Soup } from "lucide-react";
import { clsx } from "clsx";
import { useDastarkhwans } from "@/hooks/useDastarkhwans";

const CITIES = ["", "Lahore", "Karachi", "Faisalabad", "Multan"];

export default function DastarkhwanPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDastarkhwans(page, q, city);

  const applySearch = () => {
    setPage(1);
    setQ(input);
  };

  const selectCity = (c: string) => {
    setPage(1);
    setCity(c);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Soup size={26} className="text-brand-600" /> Free Dastarkhwan
        </h1>
        <p className="text-slate-500 text-sm">
          Free food points (dastarkhwan / langar) for the poor and needy — Lahore, Karachi, Faisalabad &amp; Multan
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
        <p>
          Community-sourced list — timings and addresses are <strong>not phone-verified</strong>. Please confirm before
          travelling, and treat every point with respect. Know a place we&apos;re missing? Contact support.
        </p>
      </div>

      {/* City tabs + search */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <button
              key={c || "all"}
              onClick={() => selectCity(c)}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                city === c
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
              )}
            >
              {c || "All cities"}
            </button>
          ))}
        </div>

        <div className="flex gap-3 ml-auto w-full sm:w-auto max-w-sm">
          <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
            <Search size={15} className="text-brand-600 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search name, area or address…"
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label="Search free food points"
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
            <div key={i} className="skeleton h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-lg font-medium text-slate-900">No matching food points</p>
          <p className="text-slate-500 text-sm mt-1">Try another city or clear your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((point) => (
            <div key={point.id} className="card-glass p-5 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 leading-snug">{point.name}</h3>
                {point.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                    <BadgeCheck size={11} /> Verified
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shrink-0">
                    Not verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="badge-brand text-[10px]">{point.type}</span>
                <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {point.city}
                  {point.area ? ` · ${point.area}` : ""}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{point.address}</p>

              {point.schedule && point.schedule !== "Not stated" && (
                <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={12} className="text-brand-600 shrink-0" /> {point.schedule}
                </p>
              )}

              {point.notes && <p className="text-[11px] italic text-slate-400 leading-relaxed">{point.notes}</p>}

              <div className="mt-auto pt-2 flex items-center gap-2">
                {point.googleMapsUrl && (
                  <a
                    href={point.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>
                )}
                {point.sourceUrl && (
                  <a
                    href={point.sourceUrl}
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
          {data.pagination.total} free food point{data.pagination.total === 1 ? "" : "s"} listed · last updated from
          public sources
        </p>
      )}
    </div>
  );
}
