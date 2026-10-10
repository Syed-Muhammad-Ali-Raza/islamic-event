"use client";

import { useMemo, useState } from "react";
import type { Charity } from "@/types";

function CharityCard({ c }: { c: Charity }) {
  const hundred = c.policyNote?.includes("100%") ?? false;
  const contacts = c.contactNumbers?.split(";").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className="card-glass p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-semibold text-slate-900 leading-snug">{c.name}</h3>
        {hundred && (
          <span className="badge border text-[10px] px-2 py-0.5 whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200">
            100% Policy
          </span>
        )}
      </div>
      {c.type && <p className="text-xs text-brand-700 font-medium mb-1">{c.type}</p>}
      <p className="text-xs text-slate-400 mb-2">
        {c.city}, {c.province}
      </p>

      {c.focus && <p className="text-sm text-slate-600 mb-2">{c.focus}</p>}

      {c.policyNote && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 mb-2">
          {c.policyNote}
        </p>
      )}

      {c.address && <p className="text-xs text-slate-500 mb-2">🏠 {c.address}</p>}

      {c.founder && (
        <p className="text-xs text-slate-500 mb-1">👤 Founded by {c.founder}{c.founded ? ` (${c.founded})` : ""}</p>
      )}
      {c.founded && !c.founder && (
        <p className="text-xs text-slate-500 mb-1">📅 Founded: {c.founded}</p>
      )}

      {contacts.length > 0 && (
        <div className="text-xs text-slate-600 mb-1">
          📞{" "}
          {contacts.map((num, i) => (
            <span key={num}>
              {i > 0 && " · "}
              {num.startsWith("+") || /^\d/.test(num) ? (
                <a href={`tel:${num.replace(/[^+\d]/g, "")}`} className="hover:text-brand-700">
                  {num}
                </a>
              ) : (
                num
              )}
            </span>
          ))}
        </div>
      )}

      {c.registration && (
        <p className="text-[11px] text-slate-400 mt-auto pt-2">✓ {c.registration}</p>
      )}

      <div className="flex flex-wrap gap-3 mt-2">
        {c.website && (
          <a
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-700 font-medium hover:underline"
          >
            🌐 Visit website
          </a>
        )}
        {c.googleMapsLink && (
          <a
            href={c.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-700 font-medium hover:underline"
          >
            📍 Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

export function CharityDirectory({
  charities,
  countries,
}: {
  charities: Charity[];
  countries: string[];
}) {
  // Cascading filters: country → province → city
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  const provinceOptions = useMemo(() => {
    const set = new Set(
      charities.filter((c) => !country || c.country === country).map((c) => c.province)
    );
    return Array.from(set).sort();
  }, [charities, country]);

  const cityOptions = useMemo(() => {
    const set = new Set(
      charities
        .filter((c) => (!country || c.country === country) && (!province || c.province === province))
        .map((c) => c.city)
    );
    return Array.from(set).sort();
  }, [charities, country, province]);

  const filtered = useMemo(
    () =>
      charities.filter(
        (c) =>
          (!country || c.country === country) &&
          (!province || c.province === province) &&
          (!city || c.city === city)
      ),
    [charities, country, province, city]
  );

  // Group by province → city for display
  const groups = useMemo(() => {
    const map = new Map<string, Charity[]>();
    for (const c of filtered) {
      const key = `${c.province} — ${c.city}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const reset = () => {
    setCountry("");
    setProvince("");
    setCity("");
  };

  return (
    <section className="mt-12" id="charities">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">🤲 Charity Directory</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl mx-auto">
          Registered charities and welfare organizations across Pakistan. &ldquo;100% donation
          policy&rdquo; means the organization states donations go directly to beneficiaries —
          always verify each policy before donating.
        </p>
      </div>

      {/* Filters: country → province → city */}
      <div className="card-glass p-4 sm:p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="charity-country" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Country
            </label>
            <select
              id="charity-country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setProvince("");
                setCity("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="charity-province" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Province / Region
            </label>
            <select
              id="charity-province"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setCity("");
              }}
              disabled={!country}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{country ? "All provinces" : "Select country first"}</option>
              {provinceOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="charity-city" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              City
            </label>
            <select
              id="charity-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!province}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{province ? "All cities" : "Select province first"}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{filtered.length}</span> organization
            {filtered.length === 1 ? "" : "s"} shown
          </p>
          {(country || province || city) && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-brand-700 font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No organizations match the selected filters.</p>
      ) : (
        <div className="space-y-10">
          {groups.map(([label, items]) => (
            <div key={label}>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-brand-500 rounded-full" />
                {label}
                <span className="text-sm font-normal text-slate-400">({items.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((c) => (
                  <CharityCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mt-8 max-w-2xl mx-auto">
        Disclaimer: this list is not exhaustive. Please verify each organization&rsquo;s current
        donation policy, registration and contact details before donating.
      </p>
    </section>
  );
}
