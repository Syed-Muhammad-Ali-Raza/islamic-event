"use client";

import Link from "next/link";
import type { UrsDate } from "@/types";

const CONFIDENCE_CHIP: Record<string, { label: string; className: string }> = {
  high: { label: "High confidence", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium confidence", className: "bg-sky-100 text-sky-700" },
  low: { label: "Low confidence", className: "bg-amber-100 text-amber-700" },
  none: { label: "Not researched", className: "bg-slate-100 text-slate-500" },
};

function confidenceChip(confidence: string) {
  const c = CONFIDENCE_CHIP[confidence] ?? CONFIDENCE_CHIP.none;
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${c.className}`}>
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
    <section className="mt-12" id="upcoming-urs">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">📅 Upcoming Urs (in order)</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl mx-auto">
          Respected Sufi shrines with researched annual Urs dates, ordered by next expected
          observance. Dates are lunar estimates — always confirm with local Auqaf / shrine
          administration a few days before travelling.
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        {upcoming.map((u) => (
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
              {u.ursRule && (
                <p className="text-[11px] text-slate-400 mt-0.5">Rule: {u.ursRule}</p>
              )}
            </div>
            <p className="text-sm font-medium text-brand-700 sm:text-right sm:max-w-[240px]">
              {u.nextExpected}
            </p>
          </div>
        ))}
      </div>

      <p className="text-center">
        <Link
          href="/darbars"
          className="text-sm text-brand-700 font-medium hover:underline"
        >
          See all shrines &amp; researched Urs dates →
        </Link>
      </p>
    </section>
  );
}
