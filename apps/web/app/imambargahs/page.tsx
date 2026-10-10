import type { Metadata } from "next";
import { Suspense } from "react";
import { ImambargahExplorer } from "@/components/directories/ImambargahExplorer";
import { fetchList } from "@/lib/server-api";
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

async function getData() {
  return fetchList<Imambargah>("/imambargahs?page=1&limit=24", 60);
}

export default async function ImambargahsPage() {
  const data = await getData();

  return (
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
      <ImambargahExplorer initialData={data ?? undefined} />
    </Suspense>
  );
}
