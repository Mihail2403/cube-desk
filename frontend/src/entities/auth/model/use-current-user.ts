import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '@/entities/auth/api/auth-api';
import { useAuthStore } from '@/entities/auth/model/auth-store';

export const authMeQueryKey = ['auth', 'me'] as const;

export const useCurrentUser = () => {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });
};
