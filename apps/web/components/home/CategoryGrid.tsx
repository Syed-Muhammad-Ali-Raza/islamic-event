"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { CATEGORY_ICONS } from "@/lib/constants";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section aria-labelledby="categories-heading">
      <div className="flex items-center justify-between mb-8">
        <h2 id="categories-heading" className="text-2xl font-bold text-slate-900">
          Browse by Category
        </h2>
        <Link href="/categories" className="text-brand-600 hover:text-brand-700 text-sm transition-colors">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-glass p-4 rounded-2xl space-y-2 animate-pulse">
                <div className="w-8 h-8 bg-surface-200 rounded-lg mx-auto" />
                <div className="h-2 bg-surface-200 rounded mx-auto w-3/4" />
              </div>
            ))
          : categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                id={`category-${cat.slug}`}
                className="group card-glass p-4 rounded-2xl text-center hover:border-brand-600/50 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                  {CATEGORY_ICONS[cat.slug] ?? "📅"}
                </div>
                <p className="text-slate-600 group-hover:text-slate-900 text-xs font-medium leading-tight transition-colors">
                  {cat.name}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
