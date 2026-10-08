import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Events",
  description:
    "Search and filter religious and community events — Majlis, Milad, Dars, Quran Khwani, Iftar, Urs and more, near you.",
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
