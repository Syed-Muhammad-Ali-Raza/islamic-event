import type { Metadata } from "next";

// The list page itself is a client component, so its metadata lives here.
// Without this it inherited the root title and description verbatim, which is
// the duplicate-title pattern crawlers dislike.
export const metadata: Metadata = {
  title: "Event Organizers",
  description:
    "Browse the organizations publishing Majlis, Milad, Dars, Urs and community events on Community Events — verified organizers across Pakistan and worldwide.",
  alternates: { canonical: "/organizers" },
  openGraph: {
    title: "Event Organizers | Community Events",
    description:
      "Browse the organizations publishing religious and community events across Pakistan and worldwide.",
    url: "/organizers",
  },
};

export default function OrganizersListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
