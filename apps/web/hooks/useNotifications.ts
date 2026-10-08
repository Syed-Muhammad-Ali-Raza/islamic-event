import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/stores/auth.store";

export function useUnreadCount(enabled = true) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.unreadCount(),
    enabled: enabled && isAuthenticated,
    refetchInterval: 60_000,
  });
}

export function useNotifications(page = 1, limit = 15, enabled = true) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: () => notificationService.list(page, limit),
    enabled: enabled && isAuthenticated,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
