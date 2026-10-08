import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Event",
  description: "Publish your religious or community event in a few simple steps.",
  robots: { index: false, follow: false },
};

export default function CreateEventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
