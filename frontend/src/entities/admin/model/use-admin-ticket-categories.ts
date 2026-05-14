import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  createTicketCategory,
  deleteTicketCategory,
  updateTicketCategory,
} from '@/entities/admin/api/admin-api';
import { ticketCategoriesQueryKey } from '@/entities/ticket-category/model/use-ticket-categories';
import { mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

export const useCreateTicketCategory = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (name: string) => createTicketCategory({ name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ticketCategoriesQueryKey });
      enqueueSnackbar('Категория создана', { variant: 'success' });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(mapAxiosErrorToApiError(error).message, { variant: 'error' });
    },
  });
};

export const useUpdateTicketCategory = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: number; name: string }) =>
      updateTicketCategory({ categoryId, body: { name } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketCategoriesQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      ]);
      enqueueSnackbar('Категория обновлена', { variant: 'success' });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(mapAxiosErrorToApiError(error).message, { variant: 'error' });
    },
  });
};

export const useDeleteTicketCategory = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (categoryId: number) => deleteTicketCategory(categoryId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketCategoriesQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
      ]);
      enqueueSnackbar('Категория удалена', { variant: 'success' });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(mapAxiosErrorToApiError(error).message, { variant: 'error' });
    },
  });
};
