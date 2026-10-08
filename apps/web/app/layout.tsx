import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
  openGraph: {
    type: "website",
    siteName: "Community Events",
    title: "Community Events — Religious & Community Events Platform",
    description: "Discover religious and community events near you.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Community Events",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
