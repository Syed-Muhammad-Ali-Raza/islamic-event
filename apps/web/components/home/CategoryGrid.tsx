"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { CATEGORY_ICONS } from "@/lib/constants";
import { ArrowRight, Compass } from "lucide-react";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section aria-labelledby="categories-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Compass size={14} />
            <span>Spiritual & Community Traditions</span>
          </div>
          <h2 id="categories-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Browse by Gathering Type
          </h2>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors group"
        >
          <span>Explore all categories</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 animate-pulse shadow-xs"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl mx-auto" />
                <div className="h-3 bg-slate-100 rounded mx-auto w-3/4" />
              </div>
            ))
          : categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                id={`category-${cat.slug}`}
                className="group relative bg-white border border-slate-200/90 hover:border-brand-500/50 p-4 rounded-2xl text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center min-h-[110px]"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50/70 border border-emerald-100/60 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 group-hover:bg-brand-50 group-hover:border-brand-200 transition-all duration-200">
                  {CATEGORY_ICONS[cat.slug] ?? "📅"}
                </div>
                <p className="text-slate-800 group-hover:text-brand-700 text-xs font-semibold leading-tight transition-colors">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {cat.description}
                  </p>
                )}
              </Link>
            ))}
      </div>
    </section>
  );
}
