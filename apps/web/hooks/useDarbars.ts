import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { darbarService } from "@/services/darbar.service";
import type { Darbar, PaginatedResponse } from "@/types";

export const darbarKeys = {
  all: ["darbars"] as const,
  list: (page: number, q: string, city: string, province: string) =>
    ["darbars", "list", page, q, city, province] as const,
};

export function useDarbars(
  page = 1,
  q = "",
  city = "",
  province = "",
  limit = 24,
  initialData?: PaginatedResponse<Darbar>
) {
  return useQuery({
    queryKey: darbarKeys.list(page, q, city, province),
    queryFn: () => darbarService.list({ page, limit, q, city, province }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
