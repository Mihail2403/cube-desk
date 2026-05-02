import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMessages,
  type ListMessagesParams,
  postMessage,
} from '@/entities/ticket-message/api/message-api';
import { ticketDetailQueryKey } from '@/entities/ticket/model/use-tickets';

export const ticketMessagesQueryKey = (ticketId: number, params: ListMessagesParams) =>
  ['tickets', ticketId, 'messages', params] as const;

export const useTicketMessages = (
  ticketId: number,
  params: ListMessagesParams,
  options?: { refetchInterval?: number | false },
) =>
  useQuery({
    queryKey: ticketMessagesQueryKey(ticketId, params),
    queryFn: () => fetchMessages(ticketId, params),
    enabled: Number.isFinite(ticketId) && ticketId > 0,
    refetchInterval: options?.refetchInterval,
  });

export const usePostMessage = (ticketId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => postMessage(ticketId, formData),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets', ticketId, 'messages'] });
      void qc.invalidateQueries({ queryKey: ticketDetailQueryKey(ticketId) });
    },
  });
};
