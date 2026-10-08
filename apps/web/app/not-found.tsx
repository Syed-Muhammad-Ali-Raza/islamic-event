import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-7xl font-bold text-brand-500/40 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
        The page you are looking for doesn&apos;t exist or may have been removed.
        Let&apos;s get you back to discovering events.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link href="/" className="btn-primary">Go Home</Link>
        <Link href="/events" className="btn-secondary">Browse Events</Link>
      </div>
    </div>
  );
}
