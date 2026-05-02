import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/entities/auth/model/use-current-user';
import { useAuthStore } from '@/entities/auth/model/auth-store';
import { mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

export const ProtectedRoute = () => {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    const api = mapAxiosErrorToApiError(error);
    if (api.status === 403) {
      return <Navigate to="/forbidden" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (data && data.is_active === false) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
