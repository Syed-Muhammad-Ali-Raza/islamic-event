import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedEvents } from "@/components/home/FeaturedEvents";
import { DirectoryShowcase } from "@/components/home/DirectoryShowcase";
import { CommunityCallout } from "@/components/home/CommunityCallout";

export const metadata: Metadata = {
  title: "Community Events — Discover Religious & Community Events Near You",
  description:
    "Find Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Sufi Darbars, and Free Dastarkhwans near you across Pakistan and worldwide.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Community Events — Discover Religious & Community Events Near You",
    description:
      "Find Majlis, Milad, Mehfil-e-Naat, Dars, Quran Khwani, Sufi Darbars, and Free Dastarkhwans near you.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="container-page py-14 sm:py-20 space-y-20">
        <DirectoryShowcase />
        <CategoryGrid />
        <FeaturedEvents />
        <CommunityCallout />
      </div>
    </>
  );
}
