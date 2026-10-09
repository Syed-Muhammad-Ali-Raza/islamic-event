"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EventSummary } from "@/types";

interface Props {
  events: EventSummary[];
}

const PAKISTAN_CENTER: L.LatLngExpression = [30.3753, 69.3451];

export function EventMap({ events }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const located = events.filter(
    (e): e is EventSummary & { latitude: number; longitude: number } =>
      typeof e.latitude === "number" && typeof e.longitude === "number"
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: PAKISTAN_CENTER,
      zoom: 5,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const points: L.LatLngExpression[] = [];

    for (const event of located) {
      const point = L.latLng(event.latitude, event.longitude);
      points.push(point);

      const dateLabel = new Date(event.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      L.circleMarker(point, {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#059669",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;color:#0f172a">${event.title.replace(/</g, "&lt;")}</p>
            <p style="font-size:11px;margin:0 0 6px;color:#64748b">${dateLabel}${event.venue ? ` · ${event.venue.replace(/</g, "&lt;")}` : ""}</p>
            <a href="/events/${encodeURIComponent(event.slug)}" style="font-size:12px;color:#047857;font-weight:500">View event →</a>
          </div>`
        );
    }

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 12 });
    }

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.map((e) => e.id).join(",")]);

  const hidden = events.length - located.length;

  return (
    <div>
      <div
        id="events-map"
        ref={containerRef}
        className="card-glass overflow-hidden h-[480px] sm:h-[560px] rounded-2xl"
      />
      {(located.length === 0 || hidden > 0) && (
        <p className="text-slate-500 text-xs mt-3 text-center sm:text-left">
          {located.length === 0
            ? "No events with location data yet."
            : `${hidden} event${hidden === 1 ? "" : "s"} without coordinates not shown.`}
        </p>
      )}
      {located.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {located.slice(0, 8).map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              {event.title}
            </Link>
          ))}
          {located.length > 8 && (
            <span className="inline-flex items-center px-2 py-1.5 text-xs text-slate-400">
              +{located.length - 8} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
