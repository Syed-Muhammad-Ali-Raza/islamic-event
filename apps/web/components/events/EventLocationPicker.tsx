"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Crosshair, Loader2, X } from "lucide-react";

interface Props {
  address?: string;
  venue?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  onChange: (lat?: number, lng?: number) => void;
}

const PAKISTAN_VIEW: L.LatLngExpression = [30.3753, 69.3451];

const pinIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="font-size:26px;line-height:1;transform:translateY(-4px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">📍</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 22],
  });

export function EventLocationPicker({ address, venue, cityName, latitude, longitude, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [geocoding, setGeocoding] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.setView(PAKISTAN_VIEW, 5);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onChangeRef.current(
        Math.round(e.latlng.lat * 100000) / 100000,
        Math.round(e.latlng.lng * 100000) / 100000
      );
      setGeoMsg("");
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker with coords (geocode result or manual set)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasCoords) {
      const pos = L.latLng(latitude as number, longitude as number);
      if (!markerRef.current) {
        markerRef.current = L.marker(pos, { icon: pinIcon(), draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const ll = markerRef.current?.getLatLng();
          if (ll) {
            onChangeRef.current(
              Math.round(ll.lat * 100000) / 100000,
              Math.round(ll.lng * 100000) / 100000
            );
          }
        });
      } else {
        markerRef.current.setLatLng(pos);
      }
      map.setView(pos, Math.max(map.getZoom(), 13));
    } else if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const geocode = async () => {
    const q = [address || venue, cityName, "Pakistan"].filter(Boolean).join(", ").trim();
    if (!q || q === "Pakistan") {
      setGeoMsg("Add an address, venue or city first — or click the map to drop a pin.");
      return;
    }
    setGeocoding(true);
    setGeoMsg("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`
      );
      const arr: { lat: string; lon: string }[] = await res.json();
      if (Array.isArray(arr) && arr.length > 0) {
        onChangeRef.current(
          Math.round(parseFloat(arr[0].lat) * 100000) / 100000,
          Math.round(parseFloat(arr[0].lon) * 100000) / 100000
        );
        setGeoMsg("");
      } else {
        setGeoMsg("Location not found — click the map to place the pin manually.");
      }
    } catch {
      setGeoMsg("Geocoding failed — click the map to place the pin manually.");
    } finally {
      setGeocoding(false);
    }
  };

  const clear = () => {
    setGeoMsg("");
    onChange(undefined, undefined);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="label mb-0">Location on map</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={geocode}
            disabled={geocoding}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-50"
          >
            {geocoding ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
            {geocoding ? "Finding…" : "Find from address"}
          </button>
          {hasCoords && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>
      <p className="text-slate-500 text-xs mb-2">
        Optional — pins your event on city maps. Auto-fill from your address, or click the map / drag the pin to set
        it exactly.
      </p>

      <div ref={containerRef} className="card-glass overflow-hidden h-[260px] rounded-2xl border border-slate-200" />

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {hasCoords ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <MapPin size={12} /> {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No location set — click the map to drop a pin.</span>
        )}
        {geoMsg && <span className="text-xs text-amber-600">{geoMsg}</span>}
      </div>
    </div>
  );
}
