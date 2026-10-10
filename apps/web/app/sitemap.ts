import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const PAGE_LIMIT = 100;
const MAX_PAGES = 20; // safety cap: 20 × 100 = 2000 URLs per collection

async function fetchAllPages<T extends { slug: string; updatedAt?: string; createdAt?: string }>(
  path: string,
  map: (item: T) => MetadataRoute.Sitemap[number]
): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(`${API_URL}${path}?page=${page}&limit=${PAGE_LIMIT}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = await res.json();
      const items: T[] = Array.isArray(json?.data) ? json.data : [];
      if (items.length === 0) break;
      routes.push(...items.map(map));
      const totalPages = json?.pagination?.totalPages ?? page;
      if (page >= totalPages) break;
    }
  } catch {
    // fall through with whatever was collected
  }
  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/events`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/organizers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${APP_URL}/dastarkhwan`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${APP_URL}/imambargahs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${APP_URL}/places`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${APP_URL}/darbars`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${APP_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [eventRoutes, organizerRoutes, categoriesRes] = await Promise.all([
    fetchAllPages<{ slug: string; updatedAt?: string; createdAt: string }>("/events", (event) => ({
      url: `${APP_URL}/events/${event.slug}`,
      lastModified: new Date(event.updatedAt ?? event.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    fetchAllPages<{ slug: string }>("/organizers", (org) => ({
      url: `${APP_URL}/organizers/${org.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
    fetch(`${API_URL}/categories`, { next: { revalidate: 86400 } }).catch(() => null),
  ]);

  let categoriesJson: { data?: { slug: string }[] } | null = null;
  if (categoriesRes?.ok) {
    categoriesJson = await categoriesRes.json().catch(() => null);
  }

  const categoryRoutes: MetadataRoute.Sitemap = (categoriesJson?.data ?? []).map((cat) => ({
    url: `${APP_URL}/categories/${cat.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...categoryRoutes, ...organizerRoutes];
}
