import type { Metadata } from "next";
import { Suspense } from "react";
import { DarbarsExplorer } from "@/components/directories/DarbarsExplorer";
import { SubmitListingButton } from "@/components/dashboard/SubmitListingButton";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Darbar, UrsDate } from "@/types";

const title = "Darbars & Urs Calendar";
const description =
  "Shrines (darbars) of Pakistan and the upcoming Urs calendar — saints, cities, provinces and researched urs dates, built from public heritage sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/darbars" },
  openGraph: { title: `${title} | Community Events`, description, url: "/darbars" },
};

interface Props {
  searchParams: Promise<{ q?: string; province?: string; page?: string }>;
}

async function getData(q: string, province: string, page: number) {
  const [darbars, ursDates] = await Promise.all([
    fetchList<Darbar>(`/darbars?${buildQuery({ q, province, page, limit: 24 })}`, 60),
    fetchList<UrsDate>("/urs-dates?page=1&limit=100", 60),
  ]);
  return { darbars, ursDates };
}

export default async function DarbarsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const province = (sp.province ?? "").trim();
  const page = sanitizePage(sp.page);
  const { darbars, ursDates } = await getData(q, province, page);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Darbars & Urs Calendar", path: "/darbars" },
          ]),
          ...(darbars && darbars.data.length > 0
            ? [
                itemListJsonLd(
                  "Shrines of Pakistan",
                  darbars.data.map((d) => ({
                    name: d.name,
                    path: d.mapLink ?? "/darbars",
                  }))
                ),
              ]
            : []),
        ]}
      />
      <div className="container-page pt-6 pb-1">
        <SubmitListingButton module="darbar" />
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
      <DarbarsExplorer
        initialDarbars={darbars ?? undefined}
        initialUrs={ursDates ?? undefined}
        seed={{ q, province, page }}
      />
      </Suspense>
    </>
  );
}
