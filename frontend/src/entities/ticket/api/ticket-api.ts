import { httpClient } from '@/shared/api/http-client';
import type {
  SimilarSolutionResponse,
  TicketCreateRequest,
  TicketPriority,
  TicketResponse,
  TicketUpdateRequest,
} from '@/shared/types/api';

export interface GetTicketsParams {
  status?: string | null;
  priority?: TicketPriority | null;
  category_id?: number | null;
  updated_at__gt?: string | null;
  /** Подстрока в заголовке или описании (регистронезависимо) */
  search?: string | null;
  limit?: number;
  offset?: number;
}

export const fetchTickets = async (params: GetTicketsParams): Promise<TicketResponse[]> => {
  const { data } = await httpClient.get<TicketResponse[]>('/api/tickets', { params });
  return data;
};

export const fetchTicket = async (ticketId: number): Promise<TicketResponse> => {
  const { data } = await httpClient.get<TicketResponse>(`/api/tickets/${ticketId}`);
  return data;
};

export const createTicket = async (body: TicketCreateRequest): Promise<TicketResponse> => {
  const { data } = await httpClient.post<TicketResponse>('/api/tickets', body);
  return data;
};

export const updateTicket = async (
  ticketId: number,
  body: TicketUpdateRequest,
): Promise<TicketResponse> => {
  const { data } = await httpClient.patch<TicketResponse>(`/api/tickets/${ticketId}`, body);
  return data;
};

export const fetchSimilarSolutions = async (
  ticketId: number,
  params?: { limit?: number },
): Promise<SimilarSolutionResponse[]> => {
  const { data } = await httpClient.get<SimilarSolutionResponse[]>(
    `/api/tickets/${ticketId}/similar-solutions`,
    { params },
  );
  return data ?? [];
};
