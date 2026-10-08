import { apiClient } from "@/lib/api-client";
import type { ApiSuccess, PaginatedResponse, EventSummary, User, EventStatus } from "@/types";

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  rejectedEvents: number;
  totalUsers: number;
  totalOrganizers: number;
  pendingReports: number;
}

export interface AdminEvent extends EventSummary {
  description: string | null;
  address: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  _count: { participants: number; reports: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  isActive: boolean;
  createdAt: string;
}

export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";

export interface AdminReport {
  id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  event: { id: string; slug: string; title: string };
  user: { id: string; name: string; email: string } | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  async getDashboard() {
    const res = await apiClient.get<ApiSuccess<AdminDashboardStats>>("/admin/dashboard");
    return res.data.data;
  },

  async listEvents(page = 1, limit = 10, status?: EventStatus | "") {
    const res = await apiClient.get<PaginatedResponse<AdminEvent>>("/admin/events", {
      params: { page, limit, status: status || undefined },
    });
    return res.data;
  },

  async approveEvent(id: string) {
    const res = await apiClient.patch<ApiSuccess<unknown>>(`/admin/events/${id}/approve`);
    return res.data;
  },

  async rejectEvent(id: string, reason?: string) {
    const res = await apiClient.patch<ApiSuccess<unknown>>(`/admin/events/${id}/reject`, { reason });
    return res.data;
  },

  async cancelEvent(id: string) {
    const res = await apiClient.patch<ApiSuccess<unknown>>(`/admin/events/${id}/cancel`);
    return res.data;
  },

  async listUsers(page = 1, limit = 10) {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>("/admin/users", {
      params: { page, limit },
    });
    return res.data;
  },

  async updateUserStatus(id: string, isActive: boolean) {
    const res = await apiClient.patch<ApiSuccess<AdminUser>>(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },

  async listReports(page = 1, limit = 10) {
    const res = await apiClient.get<PaginatedResponse<AdminReport>>("/admin/reports", {
      params: { page, limit },
    });
    return res.data;
  },

  async resolveReport(id: string, status: Exclude<ReportStatus, "PENDING">) {
    const res = await apiClient.patch<ApiSuccess<AdminReport>>(`/admin/reports/${id}`, { status });
    return res.data;
  },
};
