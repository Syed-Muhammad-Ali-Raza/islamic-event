"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Star, Calendar, Users, Soup, ArrowRight } from "lucide-react";
import { useCities } from "@/hooks/useCities";

const QUICK_SEARCHES = ["Milad", "Majlis", "Mehfil-e-Naat", "Dars", "Iftar", "Quran Khwani"];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const { t } = useTranslation();
  const { data: cities } = useCities();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (selectedCity) params.set("city", selectedCity);
    router.push(`/events?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#062c23] via-[#093c30] to-[#041a15] text-white py-16 sm:py-24 border-b border-emerald-900/40">
      {/* Authentic Islamic Geometric Star Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 0l6.7 17.3L48 24l-17.3 6.7L24 48l-6.7-17.3L0 24l17.3-6.7z' fill='%23fef08a' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle architectural arched gradient backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-radial from-amber-400/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />

      <div className="container-page relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Reverent Bismillah Cartouche */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-emerald-950/70 border border-amber-400/30 text-amber-300 shadow-inner mb-6 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-arabic text-base sm:text-lg font-normal tracking-wide">
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
          </div>

          {/* Majestic Hero Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.18] mb-5 text-balance">
            {t("hero.titleDiscover")}{" "}
            <span className="text-amber-300 font-extrabold underline decoration-amber-400/40 underline-offset-4">
              {t("hero.titleReligious")}
            </span>{" "}
            {t("hero.titleAmp")}
            <br className="hidden sm:inline" />
            <span className="text-emerald-200"> {t("hero.titleCommunity")}</span>
          </h1>

          <p className="text-emerald-100/75 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            {t("hero.subtitle")}
          </p>

          {/* Interactive Multi-Part Search Console */}
          <form
            onSubmit={handleSearch}
            className="relative max-w-3xl mx-auto bg-emerald-950/80 p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-emerald-500/30 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1">
              {/* Keyword Search */}
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 sm:py-0">
                <Search size={18} className="text-emerald-400 shrink-0" />
                <input
                  id="hero-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  className="w-full bg-transparent text-white placeholder-emerald-200/40 text-sm focus:outline-none"
                />
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-7 w-px bg-emerald-700/50" />

              {/* City selector */}
              <div className="flex items-center gap-2 px-3 py-2 sm:py-0 sm:w-44">
                <MapPin size={16} className="text-amber-400 shrink-0" />
                <select
                  aria-label="Select City"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent text-emerald-100 text-xs sm:text-sm focus:outline-none cursor-pointer [&>option]:bg-emerald-950 [&>option]:text-white"
                >
                  <option value="">{t("directories.allCities")}</option>
                  {(cities ?? []).map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="hero-search-button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-full bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-400 hover:to-emerald-500 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] shrink-0"
              >
                <span>{t("hero.searchButton")}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-emerald-300/60 text-xs font-medium">{t("hero.quick")}</span>
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                id={`quick-search-${term.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => router.push(`/events?search=${encodeURIComponent(term)}`)}
                className="px-3 py-1 text-xs text-emerald-100/80 hover:text-white bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-500/20 hover:border-amber-400/40 rounded-full transition-all duration-150"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Authentic Community Highlights & Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-emerald-800/40 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/20">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/40 flex items-center justify-center text-amber-300 shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">1,200+</p>
                <p className="text-emerald-200/60 text-xs">{t("hero.eventsListed")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/20">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/40 flex items-center justify-center text-amber-300 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">
                  {cities?.length ?? "450+"}
                </p>
                <p className="text-emerald-200/60 text-xs">{t("hero.cities")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/20">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/40 flex items-center justify-center text-amber-300 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">200+</p>
                <p className="text-emerald-200/60 text-xs">{t("hero.organizers")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/20">
              <div className="w-10 h-10 rounded-lg bg-emerald-800/40 flex items-center justify-center text-amber-300 shrink-0">
                <Soup size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">200+</p>
                <p className="text-emerald-200/60 text-xs">Free Food Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
