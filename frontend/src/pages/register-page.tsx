import { Paper, Stack } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';
import { RegisterForm } from '@/features/auth-register/ui/register-form';
import { useAuthStore } from '@/entities/auth/model/auth-store';

export const RegisterPage = () => {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();

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
        <RegisterForm onSuccess={() => navigate('/tickets', { replace: true })} />
      </Paper>
    </Stack>
  );
};
