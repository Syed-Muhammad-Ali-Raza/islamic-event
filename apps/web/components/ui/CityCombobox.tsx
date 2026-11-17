"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCities, useCitySearch } from "@/hooks/useCities";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cityKey, mergeCities, rankCities } from "@/lib/cities";
import type { CitySummary } from "@/types";

interface Props {
  /** Selected city slug, or "" for all cities. */
  value: string;
  onChange: (slug: string) => void;
  id?: string;
  maxOptions?: number;
}

const DEBOUNCE_MS = 250;

/**
 * Type-ahead city picker.
 *
 * Three things keep the API quiet:
 *  1. keystrokes are debounced (`DEBOUNCE_MS`) — one request per pause;
 *  2. results are cached per normalised term (`useCitySearch`), so re-typing a
 *     term is answered from cache with no request at all;
 *  3. the already-cached full city list is ranked locally, so the dropdown
 *     paints instantly and the request only ever confirms/extends it.
 */
export function CityCombobox({ value, onChange, id = "hero-city", maxOptions = 8 }: Props) {
  const { t } = useTranslation();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = useDebouncedValue(query, DEBOUNCE_MS);
  const { data: allCities } = useCities();

  // A selected city already stored its name in the input; looking that name up
  // again would be a pointless request, so the term is blanked while the input
  // still reads exactly the picked city.
  const selectedName = useMemo(
    () => allCities?.find((c) => c.slug === value)?.name ?? "",
    [allCities, value]
  );
  const searchTerm = value && cityKey(term) === cityKey(selectedName) ? "" : term;

  const { data: matches, isFetching } = useCitySearch(searchTerm);

  const pool = useMemo(
    () => mergeCities(allCities ?? [], matches ?? []),
    [allCities, matches]
  );
  const options = useMemo(
    () => rankCities(pool, query).slice(0, maxOptions),
    [pool, query, maxOptions]
  );

  // Close on outside click (mousedown beats the option's own handler).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const choose = (city: CitySummary) => {
    onChange(city.slug);
    setQuery(city.name);
    setOpen(false);
    setActive(0);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setActive(0);
  };

  /** A typed city name (or the only remaining match) counts as a selection. */
  const resolveTyped = (text: string): CitySummary | null => {
    const key = cityKey(text);
    if (!key) return null;
    const exact = pool.find((c) => cityKey(c.name) === key);
    if (exact) return exact;
    return options.length === 1 ? options[0] : null;
  };

  const handleBlur = () => {
    if (!value) {
      const resolved = resolveTyped(query);
      if (resolved) {
        onChange(resolved.slug);
        setQuery(resolved.name);
      }
    } else if (!query.trim()) {
      // Blank text with a city still picked: show the pick again.
      const current = pool.find((c) => c.slug === value);
      if (current) setQuery(current.name);
    }
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
      } else {
        setActive((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      // Enter on a highlighted row picks it; otherwise the form searches.
      if (open && options[active]) {
        event.preventDefault();
        choose(options[active]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full text-left">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-option-${options[active].slug}` : undefined}
          aria-label={t("hero.citySearch")}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={t("hero.citySearch")}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
            if (value) onChange(""); // typing invalidates the picked city
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent text-emerald-100 text-xs sm:text-sm placeholder-emerald-200/40 focus:outline-none"
        />
        {isFetching && (
          <Loader2 size={13} className="animate-spin text-emerald-300 shrink-0" aria-hidden="true" />
        )}
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear city"
            className="shrink-0 rounded-full p-0.5 text-emerald-300/70 hover:text-white transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-4rem))] sm:w-72 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-950/95 shadow-2xl backdrop-blur-xl">
          {options.length === 0 ? (
            <p data-testid="city-no-results" className="px-3 py-2.5 text-xs text-emerald-200/60">
              {t("hero.noCities")}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t("hero.citySearch")} className="max-h-72 overflow-y-auto py-1">
              {options.map((city, index) => (
                <li
                  key={city.id}
                  id={`${id}-option-${city.slug}`}
                  role="option"
                  aria-selected={city.slug === value}
                  data-testid="city-option"
                  data-slug={city.slug}
                  onMouseDown={(event) => {
                    event.preventDefault(); // keep focus; blur must not outrun the click
                    choose(city);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-xs sm:text-sm transition-colors ${
                    index === active ? "bg-emerald-800/70 text-white" : "text-emerald-100/80"
                  }`}
                >
                  <span className="truncate">{city.name}</span>
                  <span className="shrink-0 text-[10px] text-emerald-300/60">
                    {city.state}
                    {city.eventCount > 0 ? ` · ${city.eventCount}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
