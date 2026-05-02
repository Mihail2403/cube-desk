import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#1565c0' : '#90caf9' },
      secondary: { main: mode === 'light' ? '#6a1b9a' : '#ce93d8' },
      background:
        mode === 'light'
          ? { default: '#f5f7fa', paper: '#ffffff' }
          : { default: '#0f1419', paper: '#1a2332' },
    },
    typography: {
      fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        defaultProps: { variant: 'contained', disableElevation: true },
      },
      MuiCssBaseline: {
        styleOverrides: {
          html: { height: '100%' },
          body: { height: '100%', margin: 0 },
          '#root': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      },
    },
  });
