import type { Metadata } from "next";
import { MapPinned } from "lucide-react";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi } from "@/lib/server-api";
import { CitiesExplorer } from "@/components/directories/CitiesExplorer";
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
  const withEvents = cities.filter((c) => c.eventCount > 0).length;

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
                  "Cities in Pakistan",
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
          {cities.length} cities across Pakistan — search or pick a province to find events, free
          food points, imambargahs and places near you
          {withEvents > 0 ? ` · ${withEvents} with upcoming events` : ""}.
        </p>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-20 text-slate-500">City directory unavailable right now.</div>
      ) : (
        <CitiesExplorer cities={cities} />
      )}
    </div>
  );
}
