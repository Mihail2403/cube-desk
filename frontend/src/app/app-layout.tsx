import { Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/widgets/app-header/ui/app-header';

export const AppLayout = () => (
  <>
    <AppHeader />
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Outlet />
    </Container>
  </>
);
