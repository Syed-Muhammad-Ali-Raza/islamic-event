"use client";

import { useState } from "react";
import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { Calendar, ArrowRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";

const FILTER_TABS = [
  { label: "All Gatherings", slug: undefined },
  { label: "Milad & Naat", slug: "milad-mehfil-e-naat" },
  { label: "Majlis & Jaloos", slug: "majlis-jaloos" },
  { label: "Dars & Quran", slug: "dars-quran-khwani" },
];

export function FeaturedEvents() {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { data, isLoading } = useEvents({
    limit: 6,
    category: activeTab,
  });

  return (
    <section aria-labelledby="upcoming-events-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Sparkles size={14} />
            <span>Verified Schedules</span>
          </div>
          <h2 id="upcoming-events-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Upcoming Community Events
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Confirmed religious gatherings, Mehfils, and community lectures near you.
          </p>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors group shrink-0"
        >
          <span>View all upcoming events</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.slug)}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.slug
                ? "bg-brand-600 text-white shadow-xs font-semibold"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
          : !data?.data || data.data.length === 0
            ? (
                <div className="col-span-full text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200/60">
                    <Calendar size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">No events found in this category</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Be the first organizer or devotee to list an upcoming gathering for your community.
                  </p>
                  <Link href="/events/create" className="btn-primary mt-5 inline-flex text-xs py-2 px-5">
                    + Add New Event
                  </Link>
                </div>
              )
            : data.data.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
      </div>
    </section>
  );
}
