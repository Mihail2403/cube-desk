import { Paper, Stack } from '@mui/material';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth-login/ui/login-form';
import { useAuthStore } from '@/entities/auth/model/auth-store';

export const LoginPage = () => {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/tickets';

  if (token) {
    return <Navigate to="/tickets" replace />;
  }

  return (
    <Stack
      flex={1}
      minHeight={0}
      width="100%"
      overflow="auto"
      alignItems="center"
      justifyContent="center"
      sx={{ px: 2, py: 2 }}
    >
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </Paper>
    </Stack>
  );
};
