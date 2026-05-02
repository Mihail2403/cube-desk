import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/app/app-layout';
import { ProtectedRoute } from '@/app/protected-route';
import { ForbiddenPage } from '@/pages/forbidden-page';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { RegisterPage } from '@/pages/register-page';
import { TicketPage } from '@/pages/ticket-page';
import { TicketsPage } from '@/pages/tickets-page';

export const AppRouter = () => (
  <Box
    sx={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
  </Box>
);
