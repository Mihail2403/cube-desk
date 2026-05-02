import { AppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';

export const App = () => (
  <AppProviders>
    <AppRouter />
  </AppProviders>
);
