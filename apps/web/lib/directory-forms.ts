import type { DirectoryModuleKey } from "@/types";

// ─── Submit-form field config for the nine moderated directories ─────────────
// Mirrors the API's per-module CreateSchemas (apps/api/src/modules/*/
// *.validation.ts). Only content fields live here — sourceId, organizerId and
// moderation fields are handled by the submission service. Required fields
// match the server's zod schema so a valid form always passes 422 checks.

export interface DirectoryFieldDef {
  name: string;
  /** i18n key under `fields.*`; when absent the camelCase name is humanized. */
  labelKey?: string;
  type: "text" | "textarea" | "number" | "select";
  required?: boolean;
  options?: string[];
}

export const MODULE_FIELDS: Record<DirectoryModuleKey, DirectoryFieldDef[]> = {
  dastarkhwan: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "area", labelKey: "area", type: "text" },
    { name: "address", labelKey: "address", type: "textarea", required: true },
    { name: "type", labelKey: "type", type: "text", required: true },
    { name: "schedule", labelKey: "schedule", type: "text" },
    { name: "latitude", labelKey: "latitude", type: "number" },
    { name: "longitude", labelKey: "longitude", type: "number" },
    { name: "googleMapsUrl", labelKey: "mapLink", type: "text" },
    { name: "notes", labelKey: "notes", type: "textarea" },
  ],
  imambargah: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "area", labelKey: "area", type: "text" },
    { name: "address", labelKey: "address", type: "textarea", required: true },
    { name: "confidence", labelKey: "confidence", type: "text", required: true },
    { name: "yearBuilt", labelKey: "yearBuilt", type: "text" },
    { name: "founderOrCaretaker", labelKey: "founderOrCaretaker", type: "text" },
    { name: "contact", labelKey: "contact", type: "text" },
    { name: "notes", labelKey: "notes", type: "textarea" },
  ],
  place: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "category", labelKey: "category", type: "text", required: true },
    { name: "type", labelKey: "type", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "province", labelKey: "province", type: "text", required: true },
    { name: "address", labelKey: "address", type: "textarea", required: true },
    { name: "timings", labelKey: "timings", type: "text" },
    { name: "ticket", labelKey: "ticket", type: "text" },
    { name: "description", labelKey: "description", type: "textarea" },
    { name: "mapLink", labelKey: "mapLink", type: "text" },
  ],
  darbar: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "saint", labelKey: "saint", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "province", labelKey: "province", type: "text", required: true },
    { name: "address", labelKey: "address", type: "textarea", required: true },
    { name: "saintDeathYear", labelKey: "saintDeathYear", type: "text" },
    { name: "ursDate", labelKey: "ursDate", type: "text" },
    { name: "timings", labelKey: "timings", type: "text" },
    { name: "description", labelKey: "description", type: "textarea" },
  ],
  ursDate: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "saint", labelKey: "saint", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "confidence", labelKey: "confidence", type: "text", required: true },
    { name: "saintDeathYear", labelKey: "saintDeathYear", type: "text" },
    { name: "ursRule", labelKey: "ursRule", type: "text" },
    { name: "calendarBasis", labelKey: "calendarBasis", type: "text" },
    { name: "lastObserved", labelKey: "lastObserved", type: "text" },
    { name: "nextExpected", labelKey: "nextExpected", type: "text" },
    { name: "notes", labelKey: "notes", type: "textarea" },
  ],
  procession: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    {
      name: "month",
      labelKey: "month",
      type: "select",
      required: true,
      options: ["Muharram", "Safar"],
    },
    { name: "day", labelKey: "day", type: "text", required: true },
    {
      name: "kind",
      labelKey: "kind",
      type: "select",
      options: ["procession", "road_closure", "summary"],
    },
    { name: "time", labelKey: "time", type: "text" },
    { name: "route", labelKey: "route", type: "textarea" },
    { name: "description", labelKey: "description", type: "textarea" },
  ],
  charity: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "country", labelKey: "country", type: "text", required: true },
    { name: "province", labelKey: "province", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "type", labelKey: "type", type: "text" },
    { name: "focus", labelKey: "focus", type: "text" },
    { name: "address", labelKey: "address", type: "textarea" },
    { name: "contactNumbers", labelKey: "contact", type: "text" },
    { name: "website", labelKey: "website", type: "text" },
    { name: "policyNote", labelKey: "policyNote", type: "textarea" },
  ],
  mela: [
    { name: "name", labelKey: "name", type: "text", required: true },
    { name: "city", labelKey: "city", type: "text", required: true },
    { name: "province", labelKey: "province", type: "text", required: true },
    { name: "type", labelKey: "type", type: "text" },
    { name: "venue", labelKey: "venue", type: "text" },
    { name: "address", labelKey: "address", type: "textarea" },
    { name: "whenHeld", labelKey: "whenHeld", type: "text" },
    { name: "duration", labelKey: "duration", type: "text" },
    { name: "history", labelKey: "history", type: "textarea" },
    { name: "whatHappens", labelKey: "whatHappens", type: "textarea" },
  ],
  scholar: [
    { name: "name", labelKey: "name", type: "text", required: true },
    {
      name: "sect",
      labelKey: "sect",
      type: "select",
      required: true,
      options: ["SUNNI", "SHIA"],
    },
    {
      name: "category",
      labelKey: "category",
      type: "select",
      required: true,
      options: ["SCHOLAR", "MARJA", "KHATEEB"],
    },
    { name: "honorific", labelKey: "honorific", type: "text" },
    { name: "city", labelKey: "city", type: "text" },
    { name: "country", labelKey: "country", type: "text" },
    { name: "status", labelKey: "status", type: "text" },
    { name: "bio", labelKey: "bio", type: "textarea" },
    { name: "education", labelKey: "education", type: "textarea" },
  ],
};

/** Fallback label when a field has no i18n key: "saintDeathYear" → "Saint Death Year". */
export function humanizeFieldName(name: string): string {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Validate + build the POST payload from raw form values. Returns either the
 * clean payload or a map of field→error message (all English — the API is the
 * final authority and its zod messages are surfaced on failure anyway).
 */
export function buildSubmissionPayload(
  module: DirectoryModuleKey,
  values: Record<string, string>,
  organizerId?: string
): { payload?: Record<string, unknown>; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const payload: Record<string, unknown> = {};

  for (const field of MODULE_FIELDS[module]) {
    const raw = (values[field.name] ?? "").trim();

    if (!raw) {
      if (field.required) errors[field.name] = "This field is required.";
      continue; // optional + empty → omit from the payload
    }

    if (field.type === "number") {
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[field.name] = "Must be a number.";
        continue;
      }
      payload[field.name] = num;
    } else {
      payload[field.name] = raw;
    }
  }

  if (Object.keys(errors).length > 0) return { errors };
  if (organizerId) payload.organizerId = organizerId;
  return { payload };
}
