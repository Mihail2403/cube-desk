import { Alert, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const ForbiddenPage = () => (
  <Stack minHeight="60vh" alignItems="center" justifyContent="center" spacing={2} sx={{ px: 2 }}>
    <Typography variant="h5">Доступ запрещён</Typography>
    <Alert severity="warning" sx={{ maxWidth: 480 }}>
      У вас нет прав на это действие или учётная запись неактивна.
    </Alert>
    <Button component={RouterLink} to="/tickets" variant="contained">
      К списку тикетов
    </Button>
  </Stack>
);
