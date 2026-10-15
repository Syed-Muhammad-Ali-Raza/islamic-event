import type { Metadata } from "next";
import { Suspense } from "react";
import { ImambargahExplorer } from "@/components/directories/ImambargahExplorer";
import { SubmitListingButton } from "@/components/dashboard/SubmitListingButton";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Imambargah } from "@/types";

const title = "Imambargahs";
const description =
  "Historic and notable imambargahs / karbalas of Pakistan — Lahore, Karachi, Rawalpindi, Islamabad, Peshawar, Quetta and Hyderabad, built from public news, heritage and map sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/imambargahs" },
  openGraph: { title: `${title} | Community Events`, description, url: "/imambargahs" },
};

interface Props {
  searchParams: Promise<{ q?: string; city?: string; page?: string }>;
}

async function getData(q: string, city: string, page: number) {
  return fetchList<Imambargah>(
    `/imambargahs?${buildQuery({ q, city, page, limit: 24 })}`,
    60
  );
}

export default async function ImambargahsPage({ searchParams }: Props) {
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
            { name: "Imambargahs", path: "/imambargahs" },
          ]),
          ...(data && data.data.length > 0
            ? [
                itemListJsonLd(
                  "Imambargahs of Pakistan",
                  data.data.map((d) => ({
                    name: d.name,
                    path: d.googleMapsUrl ?? "/imambargahs",
                  }))
                ),
              ]
            : []),
        ]}
      />
      <div className="container-page pt-6 pb-1">
        <SubmitListingButton module="imambargah" />
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
      <ImambargahExplorer initialData={data ?? undefined} seed={{ q, city, page }} />
      </Suspense>
    </>
  );
}
