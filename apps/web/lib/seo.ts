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
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  path?: string | null;
  organizer?: { name: string } | null;
}): JsonLd {
  // Structured address + geo coordinates make the record citable by answer
  // engines ("what is on in Lahore on 20 November") instead of just a name.
  const addressLd =
    event.address || event.city || event.country
      ? {
          "@type": "PostalAddress",
          ...(event.address ? { streetAddress: event.address } : {}),
          ...(event.city ? { addressLocality: event.city } : {}),
          addressCountry: event.country ?? "PK",
        }
      : undefined;

  const hasPlace = Boolean(event.venue || event.address || event.city);
  const hasGeo = event.latitude != null && event.longitude != null;

  // The API sends `date` as a full ISO timestamp ("2026-11-24T00:00:00.000Z"),
  // so it must be reduced to YYYY-MM-DD before a clock time is appended —
  // otherwise the emitted startDate is `…000ZT09:00:00`, which is invalid and
  // drops the event out of Google's event rich results. Times are Pakistan
  // local, so the +05:00 offset keeps them unambiguous for crawlers.
  const day = event.date.slice(0, 10);
  const startDate = event.startTime ? `${day}T${event.startTime}:00+05:00` : day;
  const endDate = event.endTime ? `${day}T${event.endTime}:00+05:00` : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: event.path ? `${APP_URL}${event.path}` : undefined,
    description: event.description ?? undefined,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.posterUrl ?? undefined,
    location: hasPlace
      ? {
          "@type": "Place",
          name: event.venue ?? event.address ?? event.city ?? undefined,
          ...(addressLd ? { address: addressLd } : {}),
          ...(hasGeo
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: event.latitude,
                  longitude: event.longitude,
                },
              }
            : {}),
        }
      : undefined,
    organizer: event.organizer
      ? { "@type": "Organization", name: event.organizer.name }
      : undefined,
  };
}
