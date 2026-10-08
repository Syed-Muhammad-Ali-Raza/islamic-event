import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types";

export interface OrganizerListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  address: string | null;
  createdAt: string;
  city: { name: string } | null;
  country: { name: string } | null;
}

export const organizerService = {
  async list(page = 1, limit = 24, search?: string) {
    const res = await apiClient.get<PaginatedResponse<OrganizerListItem>>("/organizers", {
      params: { page, limit, search: search || undefined },
    });
    return res.data;
  },
};
