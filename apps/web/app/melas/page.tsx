import type { Metadata } from "next";
import { Suspense } from "react";
import { MelaExplorer } from "@/components/directories/MelaExplorer";
import { SubmitListingButton } from "@/components/dashboard/SubmitListingButton";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Mela, AuqafUrsDate } from "@/types";

const title = "Melas & Festivals of Pakistan";
const description =
  "Traditional melas, festivals and fairs across Pakistan — Lahore, Karachi, Multan and more, with the Punjab Auqaf urs calendar, built from public sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/melas" },
  openGraph: { title: `${title} | Community Events`, description, url: "/melas" },
};

interface Props {
  searchParams: Promise<{ q?: string; city?: string; province?: string; page?: string }>;
}

async function getData(q: string, city: string, province: string, page: number) {
  const [melas, auqaf] = await Promise.all([
    fetchList<Mela>(`/melas?${buildQuery({ q, city, province, page, limit: 24 })}`, 60),
    fetchList<AuqafUrsDate>("/auqaf-urs-dates?page=1&limit=250", 60),
  ]);
  return { melas, auqaf };
}

export default async function MelasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const city = (sp.city ?? "").trim();
  const province = (sp.province ?? "").trim();
  const page = sanitizePage(sp.page);
  const { melas, auqaf } = await getData(q, city, province, page);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Melas & Festivals", path: "/melas" },
          ]),
          ...(melas && melas.data.length > 0
            ? [
                itemListJsonLd(
                  "Melas of Pakistan",
                  melas.data.map((m) => ({
                    name: m.name,
                    path: m.googleMapsUrl ?? "/melas",
                  }))
                ),
              ]
            : []),
        ]}
      />
      <div className="container-page pt-6 pb-1">
        <SubmitListingButton module="mela" />
      </div>
      <Suspense
        fallback={
          <div className="container-page py-10">
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-4 w-96 mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-56 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <MelaExplorer
          initialMelas={melas ?? undefined}
          initialAuqaf={auqaf ?? undefined}
          seed={{ q, city, province, page }}
        />
      </Suspense>
    </>
  );
}
