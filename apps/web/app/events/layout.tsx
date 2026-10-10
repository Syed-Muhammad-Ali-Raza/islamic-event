import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Events",
  description:
    "Search and filter religious and community events — Majlis, Milad, Dars, Quran Khwani, Iftar, Urs and more, near you.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Discover Events | Community Events",
    description:
      "Search and filter religious and community events — Majlis, Milad, Dars, Quran Khwani, Iftar, Urs and more, near you.",
    url: "/events",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
