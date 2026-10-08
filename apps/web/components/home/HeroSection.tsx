"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Star } from "lucide-react";

const QUICK_SEARCHES = ["Milad", "Majlis", "Mehfil-e-Naat", "Dars", "Iftar", "Quran Khwani"];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[80vh] md:min-h-[70vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Decorative Islamic pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container-page relative z-10 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Arabic title */}
          <p className="text-arabic text-gold-400 text-lg mb-4 opacity-80">بسم اللہ الرحمن الرحیم</p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-4 text-balance">
            {t("hero.titleDiscover")}{" "}
            <span className="gradient-text">{t("hero.titleReligious")}</span>
            {" "}
            {t("hero.titleAmp")}
            <br className="hidden sm:block" />
            {t("hero.titleCommunity")}
          </h1>

          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto text-balance">
            {t("hero.subtitle")}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex gap-3 card-glass p-2 rounded-2xl shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search size={18} className="text-brand-400 shrink-0" />
                <input
                  id="hero-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                id="hero-search-button"
                className="btn-primary rounded-xl shrink-0"
              >
                {t("hero.searchButton")}
              </button>
            </div>
          </form>

          {/* Quick searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-white/30 text-xs">{t("hero.quick")}</span>
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                id={`quick-search-${term.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => router.push(`/events?search=${encodeURIComponent(term)}`)}
                className="px-3 py-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-150"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              { icon: Star, label: t("hero.eventsListed"), value: "1,200+" },
              { icon: MapPin, label: t("hero.cities"), value: "50+" },
              { icon: Search, label: t("hero.organizers"), value: "200+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
