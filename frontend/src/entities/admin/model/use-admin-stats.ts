import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from '@/entities/admin/api/admin-api';

export const adminStatsQueryKey = ['admin', 'stats'] as const;

export const useAdminStats = () =>
  useQuery({
    queryKey: adminStatsQueryKey,
    queryFn: fetchAdminStats,
    staleTime: 30_000,
  });
