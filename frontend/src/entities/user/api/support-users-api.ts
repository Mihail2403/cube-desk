import { httpClient } from '@/shared/api/http-client';
import type { SupportUserResponse } from '@/shared/types/api';

export const fetchSupportStaffUsers = async (): Promise<SupportUserResponse[]> => {
  const { data } = await httpClient.get<SupportUserResponse[]>('/api/users/support');
  return data;
};
