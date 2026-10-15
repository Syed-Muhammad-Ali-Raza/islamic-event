import { apiClient } from "@/lib/api-client";
import type {
  ApiSuccess,
  MyOrganizationMembership,
  OrganizationAdmin,
  OrganizationMember,
  OrgRole,
  PaginatedResponse,
} from "@/types";
import type { OrganizerListItem } from "./organizer.service";

// ─── Organization management (super admin) + memberships ─────────────────────
// Organizations are the existing "organizers" model; the management endpoints
// live under /organizers (create/edit/deactivate are super-admin only) and
// the caller's own memberships are served by /users/me/organizations.

export interface AdminOrganizerListItem extends OrganizerListItem {
  isActive: boolean;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export const organizationService = {
  // Super-admin list — includes deactivated organizations so they can be
  // re-activated (the public list always hides them).
  async listAdmin(page = 1, limit = 20, search?: string) {
    const res = await apiClient.get<PaginatedResponse<AdminOrganizerListItem>>("/organizers", {
      params: { page, limit, search: search || undefined, includeInactive: "true" },
    });
    return res.data;
  },

  async create(data: CreateOrganizationInput) {
    const res = await apiClient.post<ApiSuccess<OrganizationAdmin>>("/organizers", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<CreateOrganizationInput>) {
    const res = await apiClient.patch<ApiSuccess<OrganizationAdmin>>(`/organizers/${id}`, data);
    return res.data.data;
  },

  async setActive(id: string, isActive: boolean) {
    const res = await apiClient.patch<ApiSuccess<{ id: string; isActive: boolean }>>(
      `/organizers/${id}/${isActive ? "activate" : "deactivate"}`
    );
    return res.data.data;
  },

  // ─── Memberships ───────────────────────────────────────────────────────────

  /** The caller's own memberships (org dashboard). */
  async listMyMemberships() {
    const res = await apiClient.get<ApiSuccess<MyOrganizationMembership[]>>(
      "/users/me/organizations"
    );
    return res.data.data;
  },

  /** Members of one org — super admin or the org's OWNER/ADMIN. */
  async listMembers(orgId: string) {
    const res = await apiClient.get<ApiSuccess<OrganizationMember[]>>(`/organizers/${orgId}/members`);
    return res.data.data;
  },

  /** Super admin only — adds an existing user (by email) to the org. */
  async addMember(orgId: string, email: string, role: OrgRole) {
    const res = await apiClient.post<ApiSuccess<OrganizationMember>>(
      `/organizers/${orgId}/members`,
      { email, role }
    );
    return res.data.data;
  },

  /** Super admin only. */
  async updateMemberRole(orgId: string, userId: string, role: OrgRole) {
    const res = await apiClient.patch<ApiSuccess<OrganizationMember>>(
      `/organizers/${orgId}/members/${userId}`,
      { role }
    );
    return res.data.data;
  },

  /** Super admin only. */
  async removeMember(orgId: string, userId: string) {
    const res = await apiClient.delete<ApiSuccess<{ removed: boolean }>>(
      `/organizers/${orgId}/members/${userId}`
    );
    return res.data.data;
  },
};
