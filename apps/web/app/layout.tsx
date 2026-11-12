import type { Metadata, Viewport } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Search Console / Bing Webmaster verification tokens. Env-driven so a new
// domain needs no code change: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION (or
// NEXT_PUBLIC_BING_SITE_VERIFICATION) in Vercel and redeploy.
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

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
    // Large image previews + unlimited snippets: required for rich results and
    // for answer engines to quote the page instead of a truncated fragment.
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(googleVerification || bingVerification
    ? {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(bingVerification
            ? { other: { "msvalidate.01": bingVerification } }
            : {}),
        },
      }
    : {}),
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
        {/* AEO/GEO: advertise the machine-readable summary to answer engines. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        {/* Cookieless page-view + Core Web Vitals reporting (Vercel's own edge
            endpoints; no third-party script and no cookie banner needed). */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
