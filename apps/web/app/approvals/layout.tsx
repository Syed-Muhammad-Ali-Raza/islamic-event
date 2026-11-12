import type { Metadata } from "next";

// Org-approval queue: auth-gated (super admin), never indexed.
export const metadata: Metadata = {
  title: "Approvals",
  robots: { index: false, follow: false },
};

export default function ApprovalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
