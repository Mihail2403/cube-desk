import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/entities/auth/model/use-current-user';

export const AdminRoute = () => {
  const { data: me, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!me || me.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
