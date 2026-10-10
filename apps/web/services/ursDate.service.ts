import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, UrsDate } from "@/types";

export const ursDateService = {
  async list(params: { page?: number; limit?: number; q?: string; city?: string; researched?: string }) {
    const res = await apiClient.get<PaginatedResponse<UrsDate>>("/urs-dates", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        q: params.q || undefined,
        city: params.city || undefined,
        researched: params.researched || undefined,
      },
    });
    return res.data;
  },
};
