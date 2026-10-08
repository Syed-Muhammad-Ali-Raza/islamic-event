import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_ICONS } from "@/lib/constants";
import { fetchFromApi } from "@/lib/server-api";
import type { Category } from "@/types";

export const metadata: Metadata = {
  title: "Event Categories",
  description:
    "Browse Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Urs, Iftar and more religious and community event categories.",
};

export default async function CategoriesPage() {
  const categories = (await fetchFromApi<Category[]>("/categories", 300)) ?? [];

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
        <p className="text-white/50 text-sm">
          Find events by type — from weekly Majlis to annual Urs celebrations
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-white/40">No categories found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group card-glass p-6 text-center hover:border-brand-600/50 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {CATEGORY_ICONS[cat.slug] ?? "📅"}
              </div>
              <p className="text-white font-medium text-sm group-hover:text-brand-300 transition-colors">
                {cat.name}
              </p>
              {cat.description && (
                <p className="text-white/40 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
