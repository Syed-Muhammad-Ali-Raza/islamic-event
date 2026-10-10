import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ursDateService } from "@/services/ursDate.service";

export const ursDateKeys = {
  all: ["urs-dates"] as const,
  list: (page: number, q: string, city: string, researched: string) =>
    ["urs-dates", "list", page, q, city, researched] as const,
};

export function useUrsDates(page = 1, q = "", city = "", researched = "", limit = 100) {
  return useQuery({
    queryKey: ursDateKeys.list(page, q, city, researched),
    queryFn: () => ursDateService.list({ page, limit, q, city, researched }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
