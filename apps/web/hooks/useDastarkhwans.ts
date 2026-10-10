import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dastarkhwanService } from "@/services/dastarkhwan.service";

export const dastarkhwanKeys = {
  all: ["dastarkhwans"] as const,
  list: (page: number, q: string, city: string) =>
    ["dastarkhwans", "list", page, q, city] as const,
};

export function useDastarkhwans(page = 1, q = "", city = "", limit = 24) {
  return useQuery({
    queryKey: dastarkhwanKeys.list(page, q, city),
    queryFn: () => dastarkhwanService.list({ page, limit, q, city }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
