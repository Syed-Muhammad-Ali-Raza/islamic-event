import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminService, type AdminCategory } from "@/services/admin.service";
import type { EventStatus } from "@/types";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: ["admin", "dashboard"] as const,
  events: (page: number, status: string) => ["admin", "events", page, status] as const,
  users: (page: number) => ["admin", "users", page] as const,
  reports: (page: number) => ["admin", "reports", page] as const,
  categories: ["admin", "categories"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => adminService.getDashboard(),
    staleTime: 30_000,
  });
}

export function useAdminEvents(page = 1, status: EventStatus | "" = "", limit = 10) {
  return useQuery({
    queryKey: adminKeys.events(page, status),
    queryFn: () => adminService.listEvents(page, limit, status),
    placeholderData: keepPreviousData,
  });
}

const eventListRoot = ["events"];

export function useAdminEventAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject" | "cancel"; reason?: string }) => {
      if (action === "approve") return adminService.approveEvent(id);
      if (action === "reject") return adminService.rejectEvent(id, reason);
      return adminService.cancelEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: eventListRoot });
    },
  });
}

export function useAdminUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: adminKeys.users(page),
    queryFn: () => adminService.listUsers(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users(1) });
    },
  });
}

export function useAdminReports(page = 1, limit = 10) {
  return useQuery({
    queryKey: adminKeys.reports(page),
    queryFn: () => adminService.listReports(page, limit),
    placeholderData: keepPreviousData,
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN" }) =>
      adminService.resolveReport(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: () => adminService.listCategoriesAdmin(),
    staleTime: 30_000,
  });
}

export type CategoryAction =
  | { type: "create"; data: { name: string; description?: string; icon?: string; sortOrder?: number } }
  | { type: "update"; id: string; data: { name?: string; description?: string; icon?: string; isActive?: boolean; sortOrder?: number } }
  | { type: "delete"; id: string };

export function useCategoryAction() {
  const queryClient = useQueryClient();
  return useMutation<AdminCategory | null, Error, CategoryAction>({
    mutationFn: (action) => {
      if (action.type === "create") return adminService.createCategory(action.data);
      if (action.type === "update") return adminService.updateCategory(action.id, action.data);
      return adminService.deleteCategory(action.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
