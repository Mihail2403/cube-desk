import { useQuery } from '@tanstack/react-query';
import { fetchTicketCategories } from '@/entities/ticket-category/api/ticket-category-api';

export const ticketCategoriesQueryKey = ['ticket-categories'] as const;

interface UseTicketCategoriesOptions {
  enabled?: boolean;
}

export const useTicketCategories = (options?: UseTicketCategoriesOptions) =>
  useQuery({
    queryKey: ticketCategoriesQueryKey,
    queryFn: fetchTicketCategories,
    enabled: options?.enabled ?? true,
  });
