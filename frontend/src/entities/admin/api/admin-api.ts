import { httpClient } from '@/shared/api/http-client';
import type { components } from '@/shared/api/generated-types';
import type { SupportUserResponse, UserRole } from '@/shared/types/api';

export type AdminDashboardStatsResponse = components['schemas']['AdminDashboardStatsResponse'];

export const fetchAdminStats = async (): Promise<AdminDashboardStatsResponse> => {
  const { data } = await httpClient.get<AdminDashboardStatsResponse>('/api/admin/stats');
  return data;
};

interface PatchUserRoleParams {
  userId: number;
  role: UserRole;
}

export const patchUserRole = async ({
  userId,
  role,
}: PatchUserRoleParams): Promise<SupportUserResponse> => {
  const { data } = await httpClient.patch<SupportUserResponse>(`/api/admin/users/${userId}/role`, {
    role,
  });
  return data;
};
