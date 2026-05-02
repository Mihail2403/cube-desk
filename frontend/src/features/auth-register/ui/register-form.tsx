import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { register as registerUser } from '@/entities/auth/api/auth-api';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const schema = z.object({
  login: z.string().min(3, 'Минимум 3 символа').max(64, 'Максимум 64 символа'),
  password: z.string().min(8, 'Минимум 8 символов').max(128, 'Максимум 128 символов'),
});

export type RegisterFormValues = z.infer<typeof schema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values);
      onSuccess();
    } catch (e) {
      const api = mapAxiosErrorToApiError(e);
      if (api.status === 422) {
        applyApiValidationToForm(api, setError);
      }
      setError('root', {
        message:
          api.status === 409
            ? 'Этот логин уже занят'
            : api.message || 'Не удалось зарегистрироваться',
      });
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Регистрация
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
          autoComplete="new-password"
          fullWidth
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Создание…' : 'Создать аккаунт'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/login">
            Войти
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};
