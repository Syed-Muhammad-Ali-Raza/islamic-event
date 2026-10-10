import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Community Events — Religious & Community Events Platform",
    short_name: "Community Events",
    description:
      "Discover and share Majlis, Milad, Mehfil-e-Naat, Dars, and other religious and community events across Pakistan and worldwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  };
}
