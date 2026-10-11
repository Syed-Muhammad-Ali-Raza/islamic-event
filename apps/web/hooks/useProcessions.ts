import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { processionService } from "@/services/procession.service";
import type { PaginatedResponse, Procession } from "@/types";

export const processionKeys = {
  all: ["processions"] as const,
  list: (page: number, q: string, city: string, month: string) =>
    ["processions", "list", page, q, city, month] as const,
};

export function useProcessions(
  page = 1,
  q = "",
  city = "",
  month = "",
  limit = 24,
  initialData?: PaginatedResponse<Procession>
) {
  return useQuery({
    queryKey: processionKeys.list(page, q, city, month),
    queryFn: () => processionService.list({ page, limit, q, city, month }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
