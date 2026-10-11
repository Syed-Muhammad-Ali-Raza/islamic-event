"use client";

import Link from "next/link";
import { PlusCircle, MapPin, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

const POPULAR_CITIES = [
  { name: "Lahore", slug: "lahore", count: "300+" },
  { name: "Karachi", slug: "karachi", count: "250+" },
  { name: "Islamabad", slug: "islamabad", count: "120+" },
  { name: "Rawalpindi", slug: "rawalpindi", count: "140+" },
  { name: "Multan", slug: "multan", count: "90+" },
  { name: "Faisalabad", slug: "faisalabad", count: "80+" },
  { name: "Peshawar", slug: "peshawar", count: "60+" },
  { name: "Quetta", slug: "quetta", count: "40+" },
];

export function CommunityCallout() {
  return (
    <section className="space-y-12">
      {/* City Quick Explorer Strip */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin size={18} className="text-brand-600" />
              <span>Explore Gatherings by Major City</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant access to verified schedules, shrines, and langar points in your area.
            </p>
          </div>
          <Link
            href="/cities"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View all 50+ cities</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/events?city=${city.slug}`}
              className="group p-3 rounded-xl border border-slate-200/70 hover:border-brand-500/50 hover:bg-emerald-50/40 text-center transition-all duration-150"
            >
              <p className="font-semibold text-slate-800 group-hover:text-brand-700 text-xs sm:text-sm">
                {city.name}
              </p>
              <p className="text-[10px] text-slate-400 group-hover:text-brand-600 font-medium mt-0.5">
                {city.count} listings
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Community Organizer Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#063026] via-[#094134] to-[#05231c] text-white p-8 sm:p-12 border border-emerald-800/50 shadow-xl">
        {/* Subtle geometric background motif */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l5 15 15 5-15 5-5 15-5-15-15-5 15-5z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/30 text-amber-300 text-xs font-semibold mb-4">
            <HeartHandshake size={14} />
            <span>Community-Driven & 100% Free</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Hosting a Gathering or Managing a Sacred Space?
          </h2>

          <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed mb-8">
            Help devotees, families, and travelers find your Milad, Majlis, Dars, or Dastarkhwan food center. Listing takes less than two minutes and reaches tens of thousands across Pakistan.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              <PlusCircle size={16} />
              <span>Submit an Event</span>
            </Link>

            <Link
              href="/organizers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition-all"
            >
              <span>Explore Organizers</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-800/60 flex flex-wrap items-center gap-6 text-xs text-emerald-200/70">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-amber-400" />
              <span>Moderated & verified listings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-amber-400" />
              <span>Pin-point venue navigation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
