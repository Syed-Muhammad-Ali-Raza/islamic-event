import { useQuery } from "@tanstack/react-query";
import { cityService } from "@/services/city.service";

export const cityKeys = {
  all: ["cities"] as const,
  list: ["cities", "list"] as const,
};

export function useCities() {
  return useQuery({
    queryKey: cityKeys.list,
    queryFn: () => cityService.list(),
    staleTime: 300_000,
  });
}
