import type { Metadata } from "next";
import { Suspense } from "react";
import { ScholarsExplorer } from "@/components/directories/ScholarsExplorer";
import { SubmitListingButton } from "@/components/dashboard/SubmitListingButton";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Scholar } from "@/types";

const title = "Scholars — Shia & Sunni";
const description =
  "Directory of notable Shia and Sunni scholars — marja, khateebs and writers with bios, works and source links, built from public encyclopaedia sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/scholars" },
  openGraph: { title: `${title} | Community Events`, description, url: "/scholars" },
};

interface Props {
  searchParams: Promise<{ q?: string; city?: string; sect?: string; category?: string; page?: string }>;
}

async function getData(q: string, city: string, sect: string, category: string, page: number) {
  return fetchList<Scholar>(
    `/scholars?${buildQuery({ q, city, sect, category, page, limit: 24 })}`,
    60
  );
}

export default async function ScholarsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const city = (sp.city ?? "").trim();
  const sect = (sp.sect ?? "").trim();
  const category = (sp.category ?? "").trim();
  const page = sanitizePage(sp.page);
  const scholars = await getData(q, city, sect, category, page);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Scholars", path: "/scholars" },
          ]),
          ...(scholars && scholars.data.length > 0
            ? [
                itemListJsonLd(
                  "Islamic Scholars Directory",
                  scholars.data.map((s) => ({
                    name: s.name,
                    path: `/scholars?q=${encodeURIComponent(s.name)}`,
                  }))
                ),
              ]
            : []),
        ]}
      />
      <div className="container-page pt-6 pb-1">
        <SubmitListingButton module="scholar" />
      </div>
      <Suspense
        fallback={
          <div className="container-page py-10">
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-4 w-96 mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-48 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <ScholarsExplorer
          initialScholars={scholars ?? undefined}
          seed={{ q, city, sect, category, page }}
        />
      </Suspense>
    </>
  );
}
