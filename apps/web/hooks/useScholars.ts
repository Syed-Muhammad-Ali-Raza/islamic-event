import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { scholarService } from "@/services/scholar.service";
import type { Scholar, PaginatedResponse } from "@/types";

export const scholarKeys = {
  all: ["scholars"] as const,
  list: (page: number, q: string, sect: string, category: string, city: string) =>
    ["scholars", "list", page, q, sect, category, city] as const,
};

export function useScholars(
  page = 1,
  q = "",
  sect = "",
  category = "",
  city = "",
  limit = 24,
  initialData?: PaginatedResponse<Scholar>
) {
  return useQuery({
    queryKey: scholarKeys.list(page, q, sect, category, city),
    queryFn: () => scholarService.list({ page, limit, q, sect, category, city }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
