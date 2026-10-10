const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Community Events";

export interface JsonLd {
  "@context": "https://schema.org";
  [key: string]: unknown;
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/icon`,
    description:
      "Discover and share religious and community events — Majlis, Milad, Mehfil-e-Naat, Dars, Urs and more.",
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/events?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${APP_URL}${item.path}`,
    })),
  };
}

export interface ItemListEntry {
  name: string;
  path: string;
}

export function itemListJsonLd(name: string, entries: ItemListEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      url: entry.path.startsWith("http") ? entry.path : `${APP_URL}${entry.path}`,
    })),
  };
}

export function eventJsonLd(event: {
  title: string;
  description?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  posterUrl?: string | null;
  venue?: string | null;
  address?: string | null;
  organizer?: { name: string } | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: `${event.date}T${event.startTime ?? "00:00"}:00`,
    endDate: event.endTime ? `${event.date}T${event.endTime}:00` : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.posterUrl ?? undefined,
    location: event.venue
      ? { "@type": "Place", name: event.venue, address: event.address ?? undefined }
      : event.address
        ? { "@type": "Place", name: event.address }
        : undefined,
    organizer: event.organizer
      ? { "@type": "Organization", name: event.organizer.name }
      : undefined,
  };
}
