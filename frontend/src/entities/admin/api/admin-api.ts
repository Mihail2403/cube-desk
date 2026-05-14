import { httpClient } from '@/shared/api/http-client';
import type { components } from '@/shared/api/generated-types';
import type {
  SupportUserResponse,
  TicketCategoryCreateRequest,
  TicketCategoryResponse,
  TicketCategoryUpdateRequest,
  UserRole,
} from '@/shared/types/api';

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

export const createTicketCategory = async (
  body: TicketCategoryCreateRequest,
): Promise<TicketCategoryResponse> => {
  const { data } = await httpClient.post<TicketCategoryResponse>('/api/admin/ticket-categories', body);
  return data;
};

export const updateTicketCategory = async ({
  categoryId,
  body,
}: {
  categoryId: number;
  body: TicketCategoryUpdateRequest;
}): Promise<TicketCategoryResponse> => {
  const { data } = await httpClient.patch<TicketCategoryResponse>(
    `/api/admin/ticket-categories/${categoryId}`,
    body,
  );
  return data;
};

export const deleteTicketCategory = async (categoryId: number): Promise<void> => {
  await httpClient.delete(`/api/admin/ticket-categories/${categoryId}`);
};
