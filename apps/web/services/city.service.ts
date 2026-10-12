import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, CitySummary, CityDetail } from "@/types";

export const cityService = {
  async list() {
    const res = await apiClient.get<ApiSuccess<CitySummary[]>>("/cities");
    return res.data.data;
  },
  async getBySlug(slug: string) {
    const res = await apiClient.get<ApiSuccess<CityDetail>>(`/cities/${encodeURIComponent(slug)}`);
    return res.data.data;
  },
};
