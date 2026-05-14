import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/widgets/app-header/ui/app-header';

export const AppLayout = () => (
  <Box
    sx={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}
  >
    <AppHeader />
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        py: 3,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <Outlet />
    </Container>
  </Box>
);
