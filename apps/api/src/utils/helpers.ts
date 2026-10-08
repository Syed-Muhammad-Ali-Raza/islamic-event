import slugify from "slugify";

/**
 * Generate a URL-friendly slug from a string.
 * Appends a short random suffix to avoid collisions on identical titles.
 */
export function generateSlug(text: string, withSuffix = false): string {
  const base = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    locale: "en",
  });

  if (!withSuffix) return base;

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/**
 * Parse and clamp pagination query params.
 */
export function parsePagination(
  page: unknown,
  limit: unknown,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(String(limit ?? "20"), 10) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

/**
 * Strip undefined keys so Prisma doesn't receive explicit undefineds.
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
