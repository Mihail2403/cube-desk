import { httpClient } from '@/shared/api/http-client';
import type { TicketMessageResponse } from '@/shared/types/api';

export interface ListMessagesParams {
  id__gt?: number | null;
  limit?: number;
  offset?: number;
}

export const fetchMessages = async (
  ticketId: number,
  params: ListMessagesParams,
): Promise<TicketMessageResponse[]> => {
  const { data } = await httpClient.get<TicketMessageResponse[]>(
    `/api/tickets/${ticketId}/messages`,
    { params },
  );
  return data;
};

export const postMessage = async (
  ticketId: number,
  formData: FormData,
): Promise<TicketMessageResponse> => {
  const { data } = await httpClient.post<TicketMessageResponse>(
    `/api/tickets/${ticketId}/messages`,
    formData,
  );
  return data;
};
