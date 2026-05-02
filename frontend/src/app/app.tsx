import { Box } from '@mui/material';
import { AppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';

export const App = () => (
  <AppProviders>
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
      <AppRouter />
    </Box>
  </AppProviders>
);
