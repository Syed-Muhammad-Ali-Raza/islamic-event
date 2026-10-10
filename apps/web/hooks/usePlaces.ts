import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { placeService } from "@/services/place.service";

export const placeKeys = {
  all: ["places"] as const,
  list: (page: number, q: string, category: string, province: string) =>
    ["places", "list", page, q, category, province] as const,
};

export function usePlaces(page = 1, q = "", category = "", province = "", limit = 24) {
  return useQuery({
    queryKey: placeKeys.list(page, q, category, province),
    queryFn: () => placeService.list({ page, limit, q, category, province }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
