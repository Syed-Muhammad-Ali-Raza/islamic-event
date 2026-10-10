import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Place } from "@/types";

export const placeService = {
  async list(params: { page?: number; limit?: number; q?: string; category?: string; province?: string }) {
    const res = await apiClient.get<PaginatedResponse<Place>>("/places", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        category: params.category || undefined,
        province: params.province || undefined,
      },
    });
    return res.data;
  },
};
