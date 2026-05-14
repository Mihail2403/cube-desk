import { httpClient } from '@/shared/api/http-client';
import type { TicketCategoryResponse } from '@/shared/types/api';

export const fetchTicketCategories = async (): Promise<TicketCategoryResponse[]> => {
  const { data } = await httpClient.get<TicketCategoryResponse[]>('/api/ticket-categories');
  return data;
};
