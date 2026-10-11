import type { Metadata } from "next";
import Link from "next/link";
import { MapPinned, CalendarDays } from "lucide-react";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi } from "@/lib/server-api";
import type { CitySummary } from "@/types";

const title = "Events by City";
const description =
  "Browse religious and community events by city across Pakistan and beyond — Lahore, Karachi, Islamabad, Rawalpindi, Multan and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cities" },
  openGraph: { title: `${title} | Community Events`, description, url: "/cities" },
};

async function getData() {
  return (await fetchFromApi<CitySummary[]>("/cities", 300)) ?? [];
}

export default async function CitiesIndexPage() {
  const cities = await getData();

  return (
    <div className="container-page py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cities", path: "/cities" },
          ]),
          ...(cities.length > 0
            ? [
                itemListJsonLd(
                  "Cities with events",
                  cities.map((c) => ({ name: c.name, path: `/cities/${c.slug}` }))
                ),
              ]
            : []),
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <MapPinned size={26} className="text-brand-600" /> Events by City
        </h1>
        <p className="text-slate-500 text-sm">
          Find events, free food points, imambargahs and places near you — pick your city
        </p>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No cities with events yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/cities/${city.slug}`}
              className="group card-glass p-5 hover:border-brand-600/50 hover:-translate-y-1 transition-all duration-200"
            >
              <p className="text-slate-900 font-semibold group-hover:text-brand-700 transition-colors">
                {city.name}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">{city.state}</p>
              <p className="inline-flex items-center gap-1.5 text-brand-700 text-xs mt-3 font-medium">
                <CalendarDays size={12} />
                {city.eventCount} event{city.eventCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
