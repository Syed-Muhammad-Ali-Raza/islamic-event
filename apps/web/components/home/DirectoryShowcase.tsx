"use client";

import Link from "next/link";
import { Soup, Star, Landmark, Ticket, ArrowUpRight, ShieldCheck, HeartHandshake, BookOpen } from "lucide-react";

export function DirectoryShowcase() {
  const directories = [
    {
      title: "Free Dastarkhwan & Langar",
      subtitle: "200+ Community Food Points",
      description: "Verified free meal distribution centers for the needy across Lahore, Karachi, Faisalabad, and Multan.",
      href: "/dastarkhwan",
      icon: Soup,
      tag: "Humanitarian",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accent: "text-emerald-700 bg-emerald-100/70 border-emerald-200",
      cta: "Find Food Points",
    },
    {
      title: "Sufi Darbars & Urs Calendar",
      subtitle: "Historic Shrines & Saints",
      description: "Researched annual Urs dates, saint biographies, and lunar calendar schedules across all provinces.",
      href: "/darbars",
      icon: Star,
      tag: "Urs Calendar",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accent: "text-amber-700 bg-amber-100/70 border-amber-200",
      cta: "View Urs Dates",
    },
    {
      title: "Historic Imambargahs",
      subtitle: "Karbalas & Heritage Sites",
      description: "Centuries-old imambargahs, Muharram mourning spaces, and historical procession landmarks.",
      href: "/imambargahs",
      icon: Landmark,
      tag: "Heritage",
      gradient: "from-slate-500/10 via-slate-500/5 to-transparent",
      accent: "text-slate-700 bg-slate-100/70 border-slate-200",
      cta: "Explore Sites",
    },
    {
      title: "Melas & Auqaf Calendar",
      subtitle: "Traditional Fairs & Festivals",
      description: "Official Punjab Auqaf Department calendar and centuries-old seasonal folk melas across Pakistan.",
      href: "/melas",
      icon: Ticket,
      tag: "Auqaf Dept",
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accent: "text-purple-700 bg-purple-100/70 border-purple-200",
      cta: "Browse Melas",
    },
    {
      title: "Shia & Sunni Scholars",
      subtitle: "96 Biographies & Works",
      description: "Marja, khateebs, writers and teachers with bios, works and source links — both sects in one directory.",
      href: "/scholars",
      icon: BookOpen,
      tag: "Directory",
      gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
      accent: "text-sky-700 bg-sky-100/70 border-sky-200",
      cta: "Browse Scholars",
    },
  ];

  return (
    <section aria-labelledby="directories-heading" className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <HeartHandshake size={14} />
            <span>Community Care & Heritage</span>
          </div>
          <h2 id="directories-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Curated Community Registers
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Public registries dedicated to humanitarian meal programs, sacred shrines, and heritage spaces.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {directories.map((dir) => {
          const Icon = dir.icon;
          return (
            <Link
              key={dir.href}
              href={dir.href}
              className="group relative flex flex-col justify-between bg-white border border-slate-200/90 hover:border-brand-500/50 p-6 rounded-2xl shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Background accent wash */}
              <div className={`absolute inset-0 bg-gradient-to-br ${dir.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
                    <Icon size={22} className="text-brand-600" />
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${dir.accent}`}>
                    {dir.tag}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-brand-700 transition-colors">
                  {dir.title}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {dir.subtitle}
                </p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                  {dir.description}
                </p>
              </div>

              <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
                <span>{dir.cta}</span>
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
