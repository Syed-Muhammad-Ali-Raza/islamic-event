import type { Metadata } from "next";

// Organizer dashboard: auth-gated, so it must never be indexed.
export const metadata: Metadata = {
  title: "Organizer Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
