import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Community Events — Religious & Community Events Platform",
    template: "%s | Community Events",
  },
  description:
    "Discover and share Majlis, Milad, Mehfil-e-Naat, Dars, and other religious and community events across Pakistan, India, UK, USA, Canada, UAE, and worldwide.",
  keywords: [
    "Majlis", "Milad", "Mehfil-e-Naat", "Dars", "Quran Khwani", "Jashan", "Urs",
    "Islamic events", "Muslim events", "Pakistani community", "Indian community",
    "South Asian events", "religious events",
  ],
  applicationName: "Community Events",
  authors: [{ name: "Community Events" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Community Events",
    title: "Community Events — Religious & Community Events Platform",
    description: "Discover religious and community events near you.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Events — Religious & Community Events Platform",
    description: "Discover religious and community events near you.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${notoNaskhArabic.variable}`}>
      <head>
        <JsonLdScript data={[websiteJsonLd(), organizationJsonLd()]} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
