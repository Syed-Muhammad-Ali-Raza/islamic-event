import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, PaginatedResponse } from "@/types";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse extends PaginatedResponse<AppNotification> {
  unreadCount: number;
}

export const notificationService = {
  async list(page = 1, limit = 15) {
    const res = await apiClient.get<NotificationListResponse>(
      `/notifications?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  async unreadCount() {
    const res = await apiClient.get<ApiSuccess<{ unreadCount: number }>>("/notifications/unread-count");
    return res.data.data.unreadCount;
  },

  async markRead(id: string) {
    const res = await apiClient.patch<ApiSuccess<unknown>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllRead() {
    const res = await apiClient.patch<ApiSuccess<{ updated: number }>>("/notifications/read-all");
    return res.data.data;
  },
};
