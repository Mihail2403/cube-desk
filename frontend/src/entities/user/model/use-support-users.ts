import { useQuery } from '@tanstack/react-query';
import { fetchSupportStaffUsers } from '@/entities/user/api/support-users-api';

export const supportStaffUsersQueryKey = ['users', 'support'] as const;

export const useSupportStaffUsers = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: supportStaffUsersQueryKey,
    queryFn: fetchSupportStaffUsers,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
