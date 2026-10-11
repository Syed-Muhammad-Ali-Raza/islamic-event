"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { clsx } from "clsx";
import type { Dastarkhwan, EventSummary, Imambargah } from "@/types";

type LayerKey = "events" | "food" | "imambargahs";

interface Props {
  events: EventSummary[];
  dastarkhwans: Dastarkhwan[];
  imambargahs: Imambargah[];
}

const LAYER_META: { key: LayerKey; label: string; color: string }[] = [
  { key: "events", label: "Events", color: "#059669" },
  { key: "food", label: "Free Food", color: "#f59e0b" },
  { key: "imambargahs", label: "Imambargahs", color: "#e11d48" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface MarkerSpec {
  lat: number;
  lng: number;
  color: string;
  popup: string;
}

export function CityMap({ events, dastarkhwans, imambargahs }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupsRef = useRef<Partial<Record<LayerKey, L.LayerGroup>>>({});
  const [enabled, setEnabled] = useState<Record<LayerKey, boolean>>({
    events: true,
    food: true,
    imambargahs: true,
  });

  const buildMarkers = (): Record<LayerKey, MarkerSpec[]> => {
    const out: Record<LayerKey, MarkerSpec[]> = {
      events: [],
      food: [],
      imambargahs: [],
    };

    for (const e of events) {
      if (typeof e.latitude === "number" && typeof e.longitude === "number") {
        const dateLabel = new Date(e.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        out.events.push({
          lat: e.latitude,
          lng: e.longitude,
          color: "#059669",
          popup: `<div style="min-width:150px"><p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#0f172a">${esc(e.title)}</p><p style="font-size:11px;margin:0 0 6px;color:#64748b">${dateLabel}</p><a href="/events/${encodeURIComponent(e.slug)}" style="font-size:12px;color:#047857;font-weight:500">View event →</a></div>`,
        });
      }
    }

    for (const d of dastarkhwans) {
      if (typeof d.latitude === "number" && typeof d.longitude === "number") {
        out.food.push({
          lat: d.latitude,
          lng: d.longitude,
          color: "#f59e0b",
          popup: `<div style="min-width:150px"><p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#0f172a">${esc(d.name)}</p><p style="font-size:11px;margin:0 0 6px;color:#64748b">${esc(d.address)}</p>${d.googleMapsUrl ? `<a href="${esc(d.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:12px;color:#b45309;font-weight:500">Open in Maps →</a>` : ""}</div>`,
        });
      }
    }

    for (const im of imambargahs) {
      if (typeof im.latitude === "number" && typeof im.longitude === "number") {
        out.imambargahs.push({
          lat: im.latitude,
          lng: im.longitude,
          color: "#e11d48",
          popup: `<div style="min-width:150px"><p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#0f172a">${esc(im.name)}</p><p style="font-size:11px;margin:0 0 6px;color:#64748b">${esc(im.address)}</p>${im.googleMapsUrl ? `<a href="${esc(im.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:12px;color:#be123c;font-weight:500">Open in Maps →</a>` : ""}</div>`,
        });
      }
    }

    return out;
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const markers = buildMarkers();

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const allPoints: L.LatLngExpression[] = [];

    for (const meta of LAYER_META) {
      const group = L.layerGroup();
      for (const m of markers[meta.key]) {
        const point = L.latLng(m.lat, m.lng);
        allPoints.push(point);
        L.circleMarker(point, {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: m.color,
          fillOpacity: 1,
        })
          .bindPopup(m.popup)
          .addTo(group);
      }
      group.addTo(map);
      groupsRef.current[meta.key] = group;
    }

    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 12 });
    } else {
      map.setView([30.3753, 69.3451], 6);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      groupsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: LayerKey) => {
    const map = mapRef.current;
    const group = groupsRef.current[key];
    if (!map || !group) return;
    const next = !enabled[key];
    if (next) group.addTo(map);
    else map.removeLayer(group);
    setEnabled((prev) => ({ ...prev, [key]: next }));
  };

  const counts: Record<LayerKey, number> = {
    events: events.length,
    food: dastarkhwans.length,
    imambargahs: imambargahs.length,
  };
  const totalMarkers =
    events.filter((e) => e.latitude != null).length +
    dastarkhwans.filter((d) => d.latitude != null).length +
    imambargahs.filter((i) => i.latitude != null).length;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {LAYER_META.map((meta) => {
          if (counts[meta.key] === 0) return null;
          return (
            <button
              key={meta.key}
              onClick={() => toggle(meta.key)}
              aria-pressed={enabled[meta.key]}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                enabled[meta.key]
                  ? "border-slate-300 bg-white text-slate-700"
                  : "border-slate-200 bg-slate-50 text-slate-400 line-through"
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: enabled[meta.key] ? meta.color : "#cbd5e1" }}
              />
              {meta.label} ({counts[meta.key]})
            </button>
          );
        })}
      </div>
      <div
        ref={containerRef}
        className="card-glass overflow-hidden h-[420px] sm:h-[520px] rounded-2xl"
      />
      {totalMarkers === 0 && (
        <p className="text-slate-500 text-xs mt-3 text-center sm:text-left">
          No locations with coordinates in this city yet.
        </p>
      )}
    </div>
  );
}
