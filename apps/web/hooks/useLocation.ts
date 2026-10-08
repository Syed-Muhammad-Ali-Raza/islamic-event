"use client";

import { useQuery } from "@tanstack/react-query";
import { Country, State } from "country-state-city";

export interface DetectedLocation {
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
  flag: string;
}

function codeToFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

async function detectLocation(): Promise<DetectedLocation | null> {
  let code = "";
  let city: string | undefined;
  let region: string | undefined;
  let apiCountry = "";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://ipwho.is/", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      if (json?.success) {
        code = String(json.country_code ?? "").toUpperCase();
        city = json.city || undefined;
        region = json.region || undefined;
        apiCountry = json.country ?? "";
      }
    }
  } catch {
    /* fall through to browser locale */
  }

  if (!code) {
    try {
      const locale = new Intl.Locale(navigator.language);
      code = locale.region ?? "";
    } catch {
      /* ignore */
    }
  }

  if (!code) return null;

  const country = Country.getCountryByCode(code);

  let stateName = region;
  if (region) {
    const match = State.getStatesOfCountry(code).find(
      (s) =>
        s.name.toLowerCase() === region!.toLowerCase() ||
        s.isoCode.toLowerCase() === region!.toLowerCase()
    );
    if (match) stateName = match.name;
  }

  return {
    city,
    region: stateName,
    country: country?.name ?? apiCountry,
    countryCode: code,
    flag: codeToFlag(code),
  };
}

export function useDetectedLocation() {
  return useQuery({
    queryKey: ["detected-location"],
    queryFn: detectLocation,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}
