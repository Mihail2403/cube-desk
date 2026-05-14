import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { patchUserRole } from '@/entities/admin/api/admin-api';
import { adminStatsQueryKey } from '@/entities/admin/model/use-admin-stats';
import { usersListQueryKey } from '@/entities/user/model/use-users';
import { mapAxiosErrorToApiError } from '@/shared/api/error-mapper';
import type { UserRole } from '@/shared/types/api';

interface UpdateUserRoleParams {
  userId: number;
  role: UserRole;
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ userId, role }: UpdateUserRoleParams) => patchUserRole({ userId, role }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: usersListQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminStatsQueryKey }),
      ]);
      enqueueSnackbar('Роль обновлена', { variant: 'success' });
    },
    onError: (error: unknown) => {
      const api = mapAxiosErrorToApiError(error);
      enqueueSnackbar(api.message, { variant: 'error' });
    },
  });
};
