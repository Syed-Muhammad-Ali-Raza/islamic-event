import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, PaginatedResponse, Category } from "@/types";

export const categoryService = {
  async listCategories() {
    const res = await apiClient.get<ApiSuccess<Category[]>>("/categories");
    return res.data.data;
  },

  async getCategory(slug: string) {
    const res = await apiClient.get<ApiSuccess<Category>>(`/categories/${slug}`);
    return res.data.data;
  },
};
