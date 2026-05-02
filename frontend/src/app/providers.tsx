import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import { useMemo, type ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { createAppTheme } from '@/shared/ui/theme';
import { ThemeModeProvider } from '@/shared/context/theme-mode-provider';
import { useThemeMode } from '@/shared/hooks/use-theme-mode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const ThemedApp = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <ThemedApp>
          <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <BrowserRouter>{children}</BrowserRouter>
          </SnackbarProvider>
        </ThemedApp>
      </ThemeModeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
