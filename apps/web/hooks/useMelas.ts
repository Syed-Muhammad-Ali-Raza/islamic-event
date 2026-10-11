import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { melaService } from "@/services/mela.service";
import type { Mela, AuqafUrsDate, PaginatedResponse } from "@/types";

export const melaKeys = {
  all: ["melas"] as const,
  list: (page: number, q: string, city: string, province: string) =>
    ["melas", "list", page, q, city, province] as const,
  auqaf: (page: number, q: string, zone: string) =>
    ["melas", "auqaf", page, q, zone] as const,
};

export function useMelas(
  page = 1,
  q = "",
  city = "",
  province = "",
  limit = 24,
  initialData?: PaginatedResponse<Mela>
) {
  return useQuery({
    queryKey: melaKeys.list(page, q, city, province),
    queryFn: () => melaService.list({ page, limit, q, city, province }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useAuqafUrsDates(
  page = 1,
  q = "",
  zone = "",
  limit = 50,
  initialData?: PaginatedResponse<AuqafUrsDate>
) {
  return useQuery({
    queryKey: melaKeys.auqaf(page, q, zone),
    queryFn: () => melaService.listAuqaf({ page, limit, q, zone }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
