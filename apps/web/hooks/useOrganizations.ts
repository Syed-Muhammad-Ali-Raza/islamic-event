import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";
import type { CreateOrganizationInput } from "@/services/organization.service";
import type { OrgRole } from "@/types";

// ─── Organization data layer ─────────────────────────────────────────────────

export const organizationKeys = {
  all: ["organizations"] as const,
  mine: ["organizations", "mine"] as const,
  adminList: (page: number, search: string) => ["organizations", "admin", page, search] as const,
  members: (orgId: string) => ["organizations", "members", orgId] as const,
};

/** The caller's own memberships (org dashboard). */
export function useMyMemberships(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.mine,
    queryFn: () => organizationService.listMyMemberships(),
    enabled,
    staleTime: 60_000,
  });
}

/** Super-admin org list (includes deactivated). */
export function useAdminOrganizations(page = 1, search = "") {
  return useQuery({
    queryKey: organizationKeys.adminList(page, search),
    queryFn: () => organizationService.listAdmin(page, 20, search || undefined),
    staleTime: 30_000,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof organizationService.create>[0]) =>
      organizationService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrganizationInput> }) =>
      organizationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useSetOrganizationActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationService.setActive(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

// ─── Memberships of one organization (super-admin management) ────────────────

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationService.listMembers(orgId),
    enabled: Boolean(orgId),
  });
}

export function useAddOrgMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: OrgRole }) =>
      organizationService.addMember(orgId, email, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useUpdateOrgMemberRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      organizationService.updateMemberRole(orgId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useRemoveOrgMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => organizationService.removeMember(orgId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}
