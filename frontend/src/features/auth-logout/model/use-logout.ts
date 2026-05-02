import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logoutRequest } from '@/entities/auth/api/auth-api';
import { authMeQueryKey } from '@/entities/auth/model/use-current-user';
import { useAuthStore } from '@/entities/auth/model/auth-store';

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: async () => {
      const refresh = useAuthStore.getState().refreshToken;
      try {
        await logoutRequest({ refresh_token: refresh });
      } catch {
        /* сеть / 401 — всё равно очищаем локальную сессию */
      }
    },
    onSettled: () => {
      clear();
      queryClient.removeQueries({ queryKey: authMeQueryKey });
      navigate('/login', { replace: true });
    },
  });
};
