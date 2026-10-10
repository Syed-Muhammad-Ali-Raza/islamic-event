"use client";

import { useMemo, useState } from "react";
import type { Procession } from "@/types";

const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  procession: { label: "Procession", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  road_closure: { label: "Road Closure", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  summary: { label: "Overview", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

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

export function MuharramJaloos({ processions }: { processions: Procession[] }) {
  const cities = useMemo(() => {
    const set = new Set(processions.map((p) => p.city));
    return ["All", ...Array.from(set).sort()];
  }, [processions]);

  const [city, setCity] = useState("All");

  const filtered = useMemo(
    () => (city === "All" ? processions : processions.filter((p) => p.city === city)),
    [processions, city]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Procession[]>();
    for (const p of filtered) {
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
  }, [filtered]);

  return (
    <section className="mt-12" id="jaloos">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">🕯️ Muharram Jaloos (Processions)</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl mx-auto">
          Traditional procession routes, timings and road closures for Muharram &amp; Safar
          across major cities. Routes may change every year — always confirm locally.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {cities.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCity(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              city === c
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No processions found for this city.</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(([key, items]) => {
            const [cityName, month] = key.split("|");
            const processionsOnly = items.filter((p) => p.kind === "procession");
            const others = items.filter((p) => p.kind !== "procession");
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
                  {cityName} — {month}
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

      <p className="text-xs text-slate-400 text-center mt-8 max-w-2xl mx-auto">
        Disclaimer: procession dates and routes are subject to local moon sighting and
        administration decisions. Google Maps links point to starting-point names only.
        Data compiled from official traffic advisories and police reports.
      </p>
    </section>
  );
}
