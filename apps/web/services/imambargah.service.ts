import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Imambargah } from "@/types";

export const imambargahService = {
  async list(params: { page?: number; limit?: number; q?: string; city?: string }) {
    const res = await apiClient.get<PaginatedResponse<Imambargah>>("/imambargahs", {
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
