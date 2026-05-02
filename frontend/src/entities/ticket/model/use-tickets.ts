import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTicket,
  fetchTicket,
  fetchTickets,
  type GetTicketsParams,
  updateTicket,
} from '@/entities/ticket/api/ticket-api';
import type { TicketCreateRequest, TicketUpdateRequest } from '@/shared/types/api';

export const ticketsListQueryKey = (params: GetTicketsParams) => ['tickets', params] as const;

export const ticketDetailQueryKey = (id: number) => ['tickets', id] as const;

export const useTicketsList = (params: GetTicketsParams) =>
  useQuery({
    queryKey: ticketsListQueryKey(params),
    queryFn: () => fetchTickets(params),
  });

export const useTicket = (ticketId: number) =>
  useQuery({
    queryKey: ticketDetailQueryKey(ticketId),
    queryFn: () => fetchTicket(ticketId),
    enabled: Number.isFinite(ticketId) && ticketId > 0,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TicketCreateRequest) => createTicket(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicket = (ticketId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TicketUpdateRequest) => updateTicket(ticketId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      void qc.invalidateQueries({ queryKey: ticketDetailQueryKey(ticketId) });
    },
  });
};
