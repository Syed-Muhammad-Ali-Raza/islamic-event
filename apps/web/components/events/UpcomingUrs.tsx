"use client";

import Link from "next/link";
import { CalendarDays, ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { UrsDate } from "@/types";

const CONFIDENCE_CHIP: Record<string, { label: string; className: string }> = {
  high: { label: "High confidence", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium confidence", className: "bg-sky-50 text-sky-700 border-sky-200" },
  low: { label: "Low confidence", className: "bg-amber-50 text-amber-700 border-amber-200" },
  none: { label: "Not researched", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

function confidenceChip(confidence: string) {
  const c = CONFIDENCE_CHIP[confidence] ?? CONFIDENCE_CHIP.none;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${c.className}`}>
      {c.label}
    </span>
  );
}

export function UpcomingUrs({ dates }: { dates: UrsDate[] }) {
  const upcoming = dates
    .filter((u) => u.researched && u.upcomingOrder != null)
    .sort((a, b) => (a.upcomingOrder ?? 0) - (b.upcomingOrder ?? 0));

  if (upcoming.length === 0) return null;

  return (
    <section className="mt-14" id="upcoming-urs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2">
            <Sparkles size={13} />
            <span>Lunar Calendar Observances</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Upcoming Urs (In Order)
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Respected Sufi shrines with researched annual Urs dates, ordered by next expected observance. Always confirm with local Auqaf or administration before travelling.
          </p>
        </div>

        <Link
          href="/darbars"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors group shrink-0"
        >
          <span>All shrines &amp; dates</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-3 mb-6">
        {upcoming.map((u) => (
          <div
            key={u.id}
            className="group bg-white border border-slate-200/90 hover:border-brand-500/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-700 to-emerald-600 text-white text-base font-bold shrink-0 shadow-xs">
              #{u.upcomingOrder}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-slate-900 text-base">{u.name}</p>
                {confidenceChip(u.confidence)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {u.saint} · <span className="font-semibold text-slate-700">{u.city}</span>
              </p>
              {u.ursRule && (
                <p className="text-xs text-slate-600 mt-1">
                  <span className="font-medium text-slate-500">Rule:</span> {u.ursRule}
                </p>
              )}
            </div>
            <div className="sm:text-right shrink-0 bg-amber-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-amber-200/60 sm:border-0">
              <span className="text-[10px] text-amber-800 uppercase font-bold block sm:hidden">Next Expected:</span>
              <p className="text-sm font-bold text-brand-700 sm:text-base">
                {u.nextExpected}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
