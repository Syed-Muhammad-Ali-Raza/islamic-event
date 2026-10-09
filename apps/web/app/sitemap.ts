import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/events`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/organizers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${APP_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/register`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [eventsRes, categoriesRes, organizersRes] = await Promise.all([
      fetch(`${API_URL}/events?limit=100`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/categories`, { next: { revalidate: 86400 } }),
      fetch(`${API_URL}/organizers?limit=100`, { next: { revalidate: 86400 } }),
    ]);

    const eventsJson = eventsRes.ok ? await eventsRes.json() : null;
    const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : null;
    const organizersJson = organizersRes.ok ? await organizersRes.json() : null;

    const eventRoutes: MetadataRoute.Sitemap = (eventsJson?.data ?? []).map(
      (event: { slug: string; updatedAt?: string; createdAt: string }) => ({
        url: `${APP_URL}/events/${event.slug}`,
        lastModified: new Date(event.updatedAt ?? event.createdAt),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const categoryRoutes: MetadataRoute.Sitemap = (categoriesJson?.data ?? []).map(
      (cat: { slug: string }) => ({
        url: `${APP_URL}/categories/${cat.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );

    const organizerRoutes: MetadataRoute.Sitemap = (organizersJson?.data ?? []).map(
      (org: { slug: string }) => ({
        url: `${APP_URL}/organizers/${org.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );

    return [...staticRoutes, ...eventRoutes, ...categoryRoutes, ...organizerRoutes];
  } catch {
    return staticRoutes;
  }
}
