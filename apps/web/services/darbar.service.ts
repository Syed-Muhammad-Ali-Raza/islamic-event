import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Darbar } from "@/types";

export const darbarService = {
  async list(params: { page?: number; limit?: number; q?: string; city?: string; province?: string }) {
    const res = await apiClient.get<PaginatedResponse<Darbar>>("/darbars", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        city: params.city || undefined,
        province: params.province || undefined,
      },
    });
    return res.data;
  },
};
