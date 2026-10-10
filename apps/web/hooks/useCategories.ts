import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => ["categories", "list"] as const,
  detail: (slug: string) => ["categories", "detail", slug] as const,
};

export function useCategories(initialData?: Category[]) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoryService.listCategories(),
    initialData,
    staleTime: 5 * 60_000, // Categories rarely change — cache for 5 minutes
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => categoryService.getCategory(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}
