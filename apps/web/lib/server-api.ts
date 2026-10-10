import type { PaginatedResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function fetchFromApi<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function fetchPaginated<T>(
  path: string,
  revalidate = 60
): Promise<{ data: T[]; pagination: Record<string, number> } | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json?.data)) return null;
    return {
      data: json.data as T[],
      pagination: (json?.pagination ?? {}) as Record<string, number>,
    };
  } catch {
    return null;
  }
}

export async function fetchList<T>(
  path: string,
  revalidate = 60
): Promise<PaginatedResponse<T> | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json?.data)) return null;
    const p = (json?.pagination ?? {}) as Record<string, number>;
    return {
      success: true,
      data: json.data as T[],
      pagination: {
        page: p.page ?? 1,
        limit: p.limit ?? 24,
        total: p.total ?? 0,
        totalPages: p.totalPages ?? 0,
      },
    };
  } catch {
    return null;
  }
}

export { API_URL };
