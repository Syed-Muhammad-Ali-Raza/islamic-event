// llms.txt — a plain-text map of the site for answer engines and AI crawlers
// (AEO / GEO). Spec: https://llmstxt.org. Serving it costs one cached route and
// gives ChatGPT/Perplexity/Claude a citation-safe summary instead of forcing
// them to guess from HTML.
import type { EventSummary } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

// Rebuild hourly; the underlying API reads are cached too, so this stays cheap.
export const revalidate = 3600;

const DIRECTORIES: { path: string; name: string; description: string }[] = [
  {
    path: "/events",
    name: "Events",
    description:
      "Approved religious and community events: Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Jashan and Urs, with date, venue, city and organizer.",
  },
  {
    path: "/categories",
    name: "Event categories",
    description: "Browse events by category (Muharram, Urs, Charity, Expo and others).",
  },
  {
    path: "/cities",
    name: "City hubs",
    description: "City pages combining local events with nearby community directories.",
  },
  {
    path: "/organizers",
    name: "Organizers",
    description: "Organizations that publish events on the platform, with their event lists.",
  },
  {
    path: "/dastarkhwan",
    name: "Free dastarkhwan points",
    description:
      "Community kitchens and free food points for the poor and needy, with city and address.",
  },
  {
    path: "/imambargahs",
    name: "Imambargahs / Karbalas",
    description: "Historic and notable Shia sacred sites, with city and confidence notes.",
  },
  {
    path: "/places",
    name: "Places",
    description: "Notable Pakistan places and heritage sites, with province, city and UNESCO status.",
  },
  {
    path: "/darbars",
    name: "Darbars / shrines",
    description: "Sufi shrines with city, province and annual Urs dates.",
  },
  {
    path: "/melas",
    name: "Melas",
    description: "Traditional fairs and festivals, including the Auqaf Urs calendar.",
  },
  {
    path: "/scholars",
    name: "Scholars",
    description: "Sunni and Shia scholars with role, city and affiliation.",
  },
];

function eventLine(event: EventSummary): string {
  const city = event.city?.name ?? "Pakistan";
  const venue = event.venue ? ` at ${event.venue}` : "";
  return `- [${event.title}](${APP_URL}/events/${event.slug}): ${event.date} · ${city}${venue}`;
}

async function upcomingEvents(): Promise<EventSummary[]> {
  try {
    const res = await fetch(`${API_URL}/events?page=1&limit=20`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? (json.data as EventSummary[]) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const events = await upcomingEvents();

  const lines: string[] = [
    "# Community Events",
    "",
    "> A Pakistan-focused community events platform: discover religious and community",
    "> events (Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Jashan, Urs) and browse",
    "> curated community directories (free dastarkhwan points, imambargahs, places,",
    "> darbars, Urs dates, Muharram processions, charities, melas and scholars).",
    "",
    `Canonical site: ${APP_URL}`,
    `Sitemap: ${APP_URL}/sitemap.xml`,
    "Interface languages: English (Urdu, Hindi and Arabic translations of the UI are available via the language switch). Event and directory records are written in English.",
    "Data notes: directory lists are curated and seeded; procession routes and Urs dates are advisory and may change, so verify with the organisers. RSVPs are free; there is no ticketing or payment.",
    "",
  ];

  if (events.length > 0) {
    lines.push("## Upcoming events", "");
    lines.push(...events.map(eventLine));
    lines.push("");
  }

  lines.push("## Sections", "");
  for (const dir of DIRECTORIES) {
    lines.push(`- [${dir.name}](${APP_URL}${dir.path}): ${dir.description}`);
  }
  lines.push("");

  lines.push(
    "## Citing this site",
    "",
    `Link to the canonical event URL (${APP_URL}/events/<slug>) and use the date, venue and city shown on that page. Dates are Pakistan local time. Do not infer ticket prices or attendance: the platform does not sell tickets.`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
