"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, ExternalLink, AlertTriangle, Sparkles, Clock, CalendarDays,
  ListOrdered, BadgeCheck, Ticket,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useMelas, useAuqafUrsDates } from "@/hooks/useMelas";
import type { Mela, AuqafUrsDate, PaginatedResponse } from "@/types";

const CITIES = [
  { v: "", k: "directories.allCities" },
  { v: "Lahore", k: "directories.cities.lahore" },
  { v: "Karachi", k: "directories.cities.karachi" },
  { v: "Faisalabad", k: "directories.cities.faisalabad" },
  { v: "Multan", k: "directories.cities.multan" },
  { v: "Islamabad", k: "directories.cities.islamabad" },
];

const PROVINCES = [
  { value: "", k: "directories.allProvinces" },
  { value: "Punjab", k: "directories.provinces.punjab" },
  { value: "Sindh", k: "directories.provinces.sindh" },
  { value: "Khyber Pakhtunkhwa", k: "directories.provinces.kpk" },
  { value: "Balochistan", k: "directories.provinces.balochistan" },
  { value: "Gilgit-Baltistan", k: "directories.provinces.gilgit" },
  { value: "Islamabad Capital Territory", k: "directories.provinces.ict" },
];

const AUQAF_ZONES = [
  "",
  "Lahore Zone",
  "Gujranwala Zone",
  "Rawalpindi Zone",
  "Faisalabad Zone",
  "Sargodha Zone",
  "Pakpattan Zone",
  "Multan Zone",
  "Bahawalpur Zone",
  "Dera Ghazi Khan Zone",
];

const clean = (s: string | null | undefined) => (s && s !== "Uncertain" && s !== "Not verified" ? s : null);

export function MelaExplorer({
  initialMelas,
  initialAuqaf,
  seed,
}: {
  initialMelas?: PaginatedResponse<Mela>;
  initialAuqaf?: PaginatedResponse<AuqafUrsDate>;
  seed: { q: string; city: string; province: string; page: number };
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<"melas" | "auqaf">("melas");

  // Melas tab state
  const [input, setInput] = useState(seed.q);
  const [q, setQ] = useState(seed.q);
  const [city, setCity] = useState(seed.city);
  const [province, setProvince] = useState(seed.province);
  const [page, setPage] = useState(seed.page);

  // Auqaf tab state (local — like the Darbars urs tab)
  const [auqafInput, setAuqafInput] = useState("");
  const [auqafQ, setAuqafQ] = useState("");
  const [zone, setZone] = useState("");

  useEffect(() => {
    setQ(seed.q);
    setInput(seed.q);
    setCity(seed.city);
    setProvince(seed.province);
    setPage(seed.page);
  }, [seed.q, seed.city, seed.province, seed.page]);

  const seedMatch =
    page === seed.page && q === seed.q && city === seed.city && province === seed.province;
  const { data, isLoading } = useMelas(page, q, city, province, 24, seedMatch ? initialMelas : undefined);

  const auqafMatch = auqafQ === "" && zone === "";
  const { data: auqafData, isLoading: auqafLoading } = useAuqafUrsDates(
    1,
    auqafQ,
    zone,
    250,
    auqafMatch ? initialAuqaf : undefined
  );

  const pushUrl = (next: { page: number; q?: string; city?: string; province?: string }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const ncity = next.city ?? city;
    const nprov = next.province ?? province;
    if (nq) params.set("q", nq);
    if (ncity) params.set("city", ncity);
    if (nprov) params.set("province", nprov);
    if (next.page > 1) params.set("page", String(next.page));
    router.push(`/melas?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setQ(input);
    pushUrl({ page: 1, q: input });
  };

  const selectCity = (c: string) => {
    setPage(1);
    setCity(c);
    pushUrl({ page: 1, city: c });
  };

  const selectProvince = (p: string) => {
    setPage(1);
    setProvince(p);
    pushUrl({ page: 1, province: p });
  };

  const gotoPage = (np: number) => {
    setPage(np);
    pushUrl({ page: np });
  };

  const applyAuqafSearch = () => setAuqafQ(auqafInput);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <Sparkles size={26} className="text-brand-600" /> {t("melas.title")}
        </h1>
        <p className="text-slate-500 text-sm">{t("melas.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5">
        <button
          onClick={() => setTab("melas")}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5",
            tab === "melas"
              ? "bg-brand-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          <Ticket size={14} /> {t("melas.tabMelas")}
        </button>
        <button
          onClick={() => setTab("auqaf")}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5",
            tab === "auqaf"
              ? "bg-brand-600 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
          )}
        >
          <ListOrdered size={14} /> {t("melas.tabAuqaf")}
        </button>
      </div>

      {tab === "melas" ? (
        <>
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              {t("melas.disclaimerPre")}
              <strong>{t("melas.disclaimerStrong")}</strong>
              {t("melas.disclaimerPost")}
            </p>
          </div>

          {/* City tabs + filters + search */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <button
                  key={c.v || "all"}
                  onClick={() => selectCity(c.v)}
                  className={clsx(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    city === c.v
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                  )}
                >
                  {t(c.k)}
                </button>
              ))}
            </div>

            <select
              value={province}
              onChange={(e) => selectProvince(e.target.value)}
              className="input w-auto px-3 py-2 text-xs"
              aria-label={t("directories.filterProvince")}
            >
              {PROVINCES.map((p) => (
                <option key={p.value || "all"} value={p.value}>
                  {t(p.k)}
                </option>
              ))}
            </select>

            <div className="flex gap-3 ml-auto w-full sm:w-auto max-w-sm">
              <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
                <Search size={15} className="text-brand-600 shrink-0" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  placeholder={t("melas.searchPlaceholder")}
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  aria-label={t("melas.searchAria")}
                />
              </div>
              <button onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
                {t("directories.search")}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-56 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="card-glass text-center py-16 px-6">
              <p className="text-5xl mb-4">🎪</p>
              <p className="text-lg font-medium text-slate-900">{t("melas.emptyTitle")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("directories.tryFilters")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((mela) => (
                <div key={mela.id} className="card-glass p-5 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 leading-snug">{mela.name}</h3>
                    {mela.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                        <BadgeCheck size={11} /> {t("directories.verified")}
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shrink-0">
                        {t("directories.notVerified")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {mela.type && <span className="badge-brand text-[10px]">{mela.type}</span>}
                    <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {mela.city} · {mela.province}
                    </span>
                  </div>

                  {clean(mela.whenHeld) && (
                    <p className="inline-flex items-start gap-1.5 text-xs text-brand-700 font-medium">
                      <CalendarDays size={12} className="shrink-0 mt-0.5" /> {mela.whenHeld}
                    </p>
                  )}

                  {mela.venue && (
                    <p className="inline-flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin size={12} className="text-brand-600 shrink-0 mt-0.5" /> {mela.venue}
                    </p>
                  )}

                  {clean(mela.duration) && (
                    <p className="inline-flex items-start gap-1.5 text-[11px] text-slate-400">
                      <Clock size={11} className="shrink-0 mt-0.5" /> {mela.duration}
                    </p>
                  )}

                  {mela.whatHappens && (
                    <p className="text-xs text-slate-600 leading-relaxed">{mela.whatHappens}</p>
                  )}

                  {mela.history && (
                    <details className="text-xs text-slate-500 leading-relaxed">
                      <summary className="cursor-pointer text-brand-700 font-medium select-none">
                        {t("melas.showHistory")}
                      </summary>
                      <p className="mt-1.5">{mela.history}</p>
                    </details>
                  )}

                  <div className="mt-auto pt-2 flex items-center gap-2">
                    {mela.googleMapsUrl && (
                      <a
                        href={mela.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                      >
                        <MapPin size={12} /> {t("directories.openMaps")}
                      </a>
                    )}
                    {mela.source && (
                      <a
                        href={mela.source.split(" ; ")[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-700 transition-colors"
                      >
                        {t("directories.source")} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page === 1}
                onClick={() => gotoPage(page - 1)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                {t("directories.prev")}
              </button>
              <span className="text-slate-500 text-sm">
                {t("directories.pageOf", { page: data.pagination.page, total: data.pagination.totalPages })}
              </span>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => gotoPage(page + 1)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                {t("directories.next")}
              </button>
            </div>
          )}

          {data && (
            <p className="text-center text-xs text-slate-400 mt-6">
              {t(data.pagination.total === 1 ? "melas.listedOne" : "melas.listedOther", {
                count: data.pagination.total,
              })}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Auqaf urs calendar tab */}
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              <strong>{t("melas.auqafDisclaimerStrong")}</strong>{" "}
              {t("melas.auqafDisclaimerPost")}
            </p>
          </div>

          {/* Zone filter + search */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="input w-auto px-3 py-2 text-xs"
              aria-label={t("melas.filterZone")}
            >
              {AUQAF_ZONES.map((z) => (
                <option key={z || "all"} value={z}>
                  {z || t("melas.allZones")}
                </option>
              ))}
            </select>

            <div className="flex gap-3 ml-auto w-full sm:w-auto max-w-sm">
              <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
                <Search size={15} className="text-brand-600 shrink-0" />
                <input
                  type="text"
                  value={auqafInput}
                  onChange={(e) => setAuqafInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyAuqafSearch()}
                  placeholder={t("melas.auqafSearchPlaceholder")}
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  aria-label={t("melas.auqafSearchAria")}
                />
              </div>
              <button onClick={applyAuqafSearch} className="btn-primary px-4 py-2.5 text-sm">
                {t("directories.search")}
              </button>
            </div>
          </div>

          {auqafLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : !auqafData || auqafData.data.length === 0 ? (
            <div className="card-glass text-center py-16 px-6">
              <p className="text-5xl mb-4">📅</p>
              <p className="text-lg font-medium text-slate-900">{t("melas.auqafEmptyTitle")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("melas.auqafNothingMatches")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {auqafData.data.map((row) => (
                <div
                  key={row.id}
                  className="card-glass p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{row.name}</p>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 shrink-0">
                        {row.zone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{row.type}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-700 sm:text-right sm:max-w-[240px]">
                    {row.dateAsPublished}
                  </p>
                  {row.googleMapsUrl && (
                    <a
                      href={row.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors shrink-0"
                    >
                      <MapPin size={12} /> {t("directories.openMaps")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {auqafData && (
            <p className="text-center text-xs text-slate-400 mt-6">
              {t(auqafData.pagination.total === 1 ? "melas.auqafListedOne" : "melas.auqafListedOther", {
                count: auqafData.pagination.total,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
