import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/entities/user/api/users-api';

export const usersListQueryKey = ['users', 'list'] as const;

export const useUsers = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: usersListQueryKey,
    queryFn: fetchUsers,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
