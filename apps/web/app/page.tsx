import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedEvents } from "@/components/home/FeaturedEvents";

export const metadata: Metadata = {
  title: "Community Events — Discover Religious & Community Events Near You",
  description:
    "Find Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, and other religious and community events near you. Join the South Asian community platform.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="container-page py-16 space-y-20">
        <CategoryGrid />
        <FeaturedEvents />
      </div>
    </>
  );
}
