import { apiClient } from "@/lib/api-client";
import type { CitySummary } from "@/types";

export const cityService = {
  async list() {
    const res = await apiClient.get<CitySummary[]>("/cities");
    return res.data;
  },
  async getBySlug(slug: string) {
    const res = await apiClient.get<CitySummary>(`/cities/${encodeURIComponent(slug)}`);
    return res.data;
  },
};
