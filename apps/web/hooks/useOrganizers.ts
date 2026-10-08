import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { organizerService } from "@/services/organizer.service";

export const organizerKeys = {
  all: ["organizers"] as const,
  list: (page: number, search: string) => ["organizers", "list", page, search] as const,
};

export function useOrganizers(page = 1, search = "", limit = 24) {
  return useQuery({
    queryKey: organizerKeys.list(page, search),
    queryFn: () => organizerService.list(page, limit, search),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
