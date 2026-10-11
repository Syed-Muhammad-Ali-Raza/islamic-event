import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacesExplorer } from "@/components/directories/PlacesExplorer";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Place } from "@/types";

const title = "Pakistan Places";
const description =
  "Historical, religious, cultural and natural places across Pakistan — forts, shrines, museums, valleys and more, with UNESCO status, timings and map links.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/places" },
  openGraph: { title: `${title} | Community Events`, description, url: "/places" },
};

interface Props {
  searchParams: Promise<{ q?: string; category?: string; province?: string; page?: string }>;
}

async function getData(q: string, category: string, province: string, page: number) {
  return fetchList<Place>(
    `/places?${buildQuery({ q, category, province, page, limit: 24 })}`,
    60
  );
}

export default async function PlacesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const category = (sp.category ?? "").trim();
  const province = (sp.province ?? "").trim();
  const page = sanitizePage(sp.page);
  const data = await getData(q, category, province, page);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pakistan Places", path: "/places" },
          ]),
          ...(data && data.data.length > 0
            ? [
                itemListJsonLd(
                  "Places in Pakistan",
                  data.data.map((d) => ({
                    name: d.name,
                    path: d.mapLink ?? "/places",
                  }))
                ),
              ]
            : []),
        ]}
      />
      <Suspense
      fallback={
        <div className="container-page py-10">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-96 mb-8" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-52 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <PlacesExplorer initialData={data ?? undefined} seed={{ q, category, province, page }} />
      </Suspense>
    </>
  );
}
