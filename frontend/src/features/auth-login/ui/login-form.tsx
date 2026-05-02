import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { login } from '@/entities/auth/api/auth-api';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const schema = z.object({
  login: z.string().min(3, 'Минимум 3 символа').max(64, 'Максимум 64 символа'),
  password: z.string().min(8, 'Минимум 8 символов').max(128, 'Максимум 128 символов'),
});

export type LoginFormValues = z.infer<typeof schema>;

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      onSuccess();
    } catch (e) {
      const api = mapAxiosErrorToApiError(e);
      if (api.status === 422) {
        applyApiValidationToForm(api, setError);
      }
      setError('root', {
        message:
          api.status === 401
            ? 'Неверный логин или пароль'
            : api.message || 'Не удалось войти',
      });
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Вход
        </Typography>
        {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
        <TextField
          label="Логин"
          autoComplete="username"
          fullWidth
          error={Boolean(errors.login)}
          helperText={errors.login?.message}
          {...register('login')}
        />
        <TextField
          label="Пароль"
          type="password"
          autoComplete="current-password"
          fullWidth
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Вход…' : 'Войти'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          Нет аккаунта?{' '}
          <Link component={RouterLink} to="/register">
            Регистрация
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};
