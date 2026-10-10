import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { imambargahService } from "@/services/imambargah.service";

export const imambargahKeys = {
  all: ["imambargahs"] as const,
  list: (page: number, q: string, city: string) =>
    ["imambargahs", "list", page, q, city] as const,
};

export function useImambargahs(page = 1, q = "", city = "", limit = 24) {
  return useQuery({
    queryKey: imambargahKeys.list(page, q, city),
    queryFn: () => imambargahService.list({ page, limit, q, city }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
