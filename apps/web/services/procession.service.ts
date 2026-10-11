import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Procession } from "@/types";

export const processionService = {
  async list(params: {
    page?: number;
    limit?: number;
    q?: string;
    city?: string;
    month?: string;
  }) {
    const res = await apiClient.get<PaginatedResponse<Procession>>("/processions", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        city: params.city || undefined,
        month: params.month || undefined,
      },
    });
    return res.data;
  },
};
