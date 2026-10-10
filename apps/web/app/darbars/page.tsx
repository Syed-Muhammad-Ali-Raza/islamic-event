"use client";

import { useState } from "react";
import { Search, MapPin, ExternalLink, AlertTriangle, Sparkles, Clock, CalendarDays, User } from "lucide-react";
import { useDarbars } from "@/hooks/useDarbars";

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

const clean = (s: string | null | undefined) => (s && s !== "Uncertain" ? s : null);

export default function DarbarsPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDarbars(page, q, "", province);

  const applySearch = () => {
    setPage(1);
    setQ(input);
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Sparkles size={26} className="text-brand-600" /> Darbars (Shrines)
        </h1>
        <p className="text-slate-500 text-sm">
          Sufi darbars &amp; shrines across Pakistan — with saints, death years and annual Urs dates
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
        <p>
          Community-sourced list built from public encyclopaedia and heritage sources — Urs dates follow the Islamic
          lunar calendar and shift about 10-11 days earlier each year, and death years from traditional accounts may
          differ between sources. Please <strong>confirm locally</strong> before travelling and treat every shrine
          with respect. Know a darbar we&apos;re missing? Contact support.
        </p>
      </div>

      {/* Province + search */}
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

      {/* Results */}
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
          {data.pagination.total} darbar{data.pagination.total === 1 ? "" : "s"} listed · built from public heritage
          sources
        </p>
      )}
    </div>
  );
}
