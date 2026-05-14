import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAdminStats } from '@/entities/admin/model/use-admin-stats';

interface StatCardProps {
  title: string;
  value: number;
  hint?: string;
}

const StatCard = ({ title, value, hint }: StatCardProps) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary" display="block">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} component="p" sx={{ my: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

export const AdminDashboardPage = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <AdminIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700} component="h1">
          Админ-панель
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" maxWidth={720}>
        Сводка по тикетам и активным пользователям. Управление ролями — в разделе «Пользователи». Работа с тикетами
        остаётся в основном разделе «Тикеты».
      </Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Typography color="error" variant="body2">
          Не удалось загрузить статистику.
        </Typography>
      )}

      {stats && (
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Тикеты
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            <StatCard title="Всего тикетов" value={stats.tickets_total} />
            <StatCard
              title="Создано за 7 дней"
              value={stats.tickets_created_last_7_days}
              hint="По дате создания"
            />
            <StatCard
              title="Обновлено за 7 дней"
              value={stats.tickets_updated_last_7_days}
              hint="Любое изменение записи"
            />
            <StatCard title="Открыты" value={stats.tickets_open} />
            <StatCard title="В работе" value={stats.tickets_in_progress} />
            <StatCard title="Решены" value={stats.tickets_resolved} hint="Статус «Решён»" />
            <StatCard title="Закрыты" value={stats.tickets_closed} hint="Статус «Закрыт»" />
          </Box>

          <Typography variant="subtitle1" fontWeight={600} sx={{ pt: 1 }}>
            Пользователи (активные)
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
            }}
          >
            <StatCard title="Всего" value={stats.active_users_total} />
            <StatCard title="Роль «Пользователь»" value={stats.active_users_role_user} />
            <StatCard title="Роль «Поддержка»" value={stats.active_users_role_support} />
            <StatCard title="Роль «Админ»" value={stats.active_users_role_admin} />
          </Box>
        </Stack>
      )}

      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Пользователи
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Список учётных записей и смена ролей. Роль администратора снять нельзя.
          </Typography>
          <Typography component={RouterLink} to="/admin/users" variant="body2" sx={{ fontWeight: 600 }}>
            Открыть список →
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};
