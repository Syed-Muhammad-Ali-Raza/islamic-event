import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacesExplorer } from "@/components/directories/PlacesExplorer";
import { fetchList } from "@/lib/server-api";
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

async function getData() {
  return fetchList<Place>("/places?page=1&limit=24", 60);
}

export default async function PlacesPage() {
  const data = await getData();

  return (
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
      <PlacesExplorer initialData={data ?? undefined} />
    </Suspense>
  );
}
