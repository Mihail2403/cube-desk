import { httpClient } from '@/shared/api/http-client';
import type { SupportUserResponse } from '@/shared/types/api';

export const fetchUsers = async (): Promise<SupportUserResponse[]> => {
  const { data } = await httpClient.get<SupportUserResponse[]>('/api/users');
  return data;
};
