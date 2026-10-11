import type { Metadata } from "next";
import { Suspense } from "react";
import { DastarkhwanExplorer } from "@/components/directories/DastarkhwanExplorer";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Dastarkhwan } from "@/types";

const title = "Free Dastarkhwan";
const description =
  "Free food points (dastarkhwan / langar) for the poor and needy across Lahore, Karachi, Faisalabad and Multan — community-sourced directory with map links.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/dastarkhwan" },
  openGraph: { title: `${title} | Community Events`, description, url: "/dastarkhwan" },
};

interface Props {
  searchParams: Promise<{ q?: string; city?: string; page?: string }>;
}

async function getData(q: string, city: string, page: number) {
  return fetchList<Dastarkhwan>(
    `/dastarkhwans?${buildQuery({ q, city, page, limit: 24 })}`,
    60
  );
}

export default async function DastarkhwanPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const city = (sp.city ?? "").trim();
  const page = sanitizePage(sp.page);
  const data = await getData(q, city, page);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free Dastarkhwan", path: "/dastarkhwan" },
          ]),
          ...(data && data.data.length > 0
            ? [
                itemListJsonLd(
                  "Free food points",
                  data.data.map((d) => ({
                    name: d.name,
                    path: d.googleMapsUrl ?? "/dastarkhwan",
                  }))
                ),
              ]
            : []),
        ]}
      />
      <Suspense
      fallback={
        <div className="container-page py-10">
          <div className="skeleton h-8 w-56 mb-2" />
          <div className="skeleton h-4 w-80 mb-8" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <DastarkhwanExplorer initialData={data ?? undefined} seed={{ q, city, page }} />
      </Suspense>
    </>
  );
}
