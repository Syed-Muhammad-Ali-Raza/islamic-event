"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Building2, BadgeCheck, MapPin } from "lucide-react";
import { useOrganizers } from "@/hooks/useOrganizers";

export default function OrganizersPage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrganizers(page, search);

  const applySearch = () => {
    setPage(1);
    setSearch(input);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Organizers</h1>
        <p className="text-slate-500 text-sm">
          Mosques, committees and community organizations publishing events
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-8 max-w-lg">
        <div className="flex-1 flex items-center gap-3 input px-4 py-3">
          <Search size={16} className="text-brand-600 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Search organizers…"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
            aria-label="Search organizers"
          />
        </div>
        <button onClick={applySearch} className="btn-primary px-5">
          Search
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-glass p-6 space-y-3 animate-pulse">
              <div className="w-12 h-12 bg-surface-200 rounded-full" />
              <div className="h-4 bg-surface-200 rounded w-2/3" />
              <div className="h-3 bg-surface-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Building2 size={40} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No organizers found</p>
          {search && (
            <button
              onClick={() => { setInput(""); setSearch(""); setPage(1); }}
              className="btn-secondary mt-4 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.data.map((org) => (
            <div key={org.id} className="card-glass p-6 hover:border-brand-600/40 transition-all">
              <div className="flex items-start gap-4">
                {org.logoUrl ? (
                  <Image
                    src={org.logoUrl}
                    alt={org.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 font-bold shrink-0">
                    {org.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-slate-900 font-semibold truncate">{org.name}</h3>
                    {org.isVerified && (
                      <BadgeCheck size={15} className="text-brand-600 shrink-0" aria-label="Verified" />
                    )}
                  </div>

                  {(org.city || org.country) && (
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin size={11} />
                      {[org.city?.name, org.country?.name].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {org.description && (
                <p className="text-slate-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                  {org.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 text-xs">
                  {org.email ?? org.website ?? "Contact via events"}
                </span>
                <Link
                  href={`/events?search=${encodeURIComponent(org.name)}`}
                  className="text-brand-600 hover:text-brand-700 text-xs font-medium transition-colors"
                >
                  View events →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
