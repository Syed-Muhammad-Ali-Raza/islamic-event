import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Mela, AuqafUrsDate } from "@/types";

export const melaService = {
  async list(params: {
    page?: number;
    limit?: number;
    q?: string;
    city?: string;
    province?: string;
    type?: string;
  }) {
    const res = await apiClient.get<PaginatedResponse<Mela>>("/melas", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 24,
        q: params.q || undefined,
        city: params.city || undefined,
        province: params.province || undefined,
        type: params.type || undefined,
      },
    });
    return res.data;
  },

  async listAuqaf(params: { page?: number; limit?: number; q?: string; zone?: string }) {
    const res = await apiClient.get<PaginatedResponse<AuqafUrsDate>>("/auqaf-urs-dates", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        q: params.q || undefined,
        zone: params.zone || undefined,
      },
    });
    return res.data;
  },
};
