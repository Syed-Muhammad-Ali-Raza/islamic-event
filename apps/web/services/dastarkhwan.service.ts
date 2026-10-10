import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Dastarkhwan } from "@/types";

export const dastarkhwanService = {
  async list(params: { page?: number; limit?: number; q?: string; city?: string }) {
    const res = await apiClient.get<PaginatedResponse<Dastarkhwan>>("/dastarkhwans", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        city: params.city || undefined,
      },
    });
    return res.data;
  },
};
