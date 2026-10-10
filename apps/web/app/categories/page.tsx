import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_ICONS } from "@/lib/constants";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi } from "@/lib/server-api";
import type { Category } from "@/types";

export const metadata: Metadata = {
  title: "Event Categories",
  description:
    "Browse Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Urs, Iftar and more religious and community event categories.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Event Categories | Community Events",
    description:
      "Browse Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Urs, Iftar and more religious and community event categories.",
    url: "/categories",
  },
};

export default async function CategoriesPage() {
  const categories = (await fetchFromApi<Category[]>("/categories", 300)) ?? [];

  return (
    <div className="container-page py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
          ]),
          ...(categories.length > 0
            ? [
                itemListJsonLd(
                  "Event categories",
                  categories.map((c) => ({ name: c.name, path: `/categories/${c.slug}` }))
                ),
              ]
            : []),
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Categories</h1>
        <p className="text-slate-500 text-sm">
          Find events by type — from weekly Majlis to annual Urs celebrations
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No categories found.</div>
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
              <p className="text-slate-900 font-medium text-sm group-hover:text-brand-700 transition-colors">
                {cat.name}
              </p>
              {cat.description && (
                <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
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
