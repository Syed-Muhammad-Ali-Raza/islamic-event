import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Scholar } from "@/types";

export const scholarService = {
  async list(params: {
    page?: number;
    limit?: number;
    q?: string;
    sect?: string;
    category?: string;
    city?: string;
  }) {
    const res = await apiClient.get<PaginatedResponse<Scholar>>("/scholars", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        sect: params.sect || undefined,
        category: params.category || undefined,
        city: params.city || undefined,
      },
    });
    return res.data;
  },
};
