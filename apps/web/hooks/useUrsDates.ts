import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ursDateService } from "@/services/ursDate.service";
import type { PaginatedResponse, UrsDate } from "@/types";

export const ursDateKeys = {
  all: ["urs-dates"] as const,
  list: (page: number, q: string, city: string, researched: string) =>
    ["urs-dates", "list", page, q, city, researched] as const,
};

export function useUrsDates(
  page = 1,
  q = "",
  city = "",
  researched = "",
  limit = 100,
  initialData?: PaginatedResponse<UrsDate>
) {
  return useQuery({
    queryKey: ursDateKeys.list(page, q, city, researched),
    queryFn: () => ursDateService.list({ page, limit, q, city, researched }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
