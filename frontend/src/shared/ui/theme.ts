import { createTheme, darken, lighten, type Theme } from '@mui/material/styles';

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
        styleOverrides: (theme: Theme) => {
          const base = {
            html: { height: '100%' },
            body: { height: '100%', margin: 0 },
            '#root': {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          };

          /* В светлой теме оставляем нативный скролл — он выглядит гармонично с системой. */
          if (theme.palette.mode !== 'dark') {
            return base;
          }

          const paper = theme.palette.background.paper;
          /* Непрозрачные цвета: полупрозрачный track на тёмном фоне даёт «серую полосу». */
          const track = darken(paper, 0.12);
          const thumb = lighten(paper, 0.35);
          const thumbHover = lighten(paper, 0.5);

          return {
            ...base,
            '*': {
              scrollbarWidth: 'thin',
              scrollbarColor: `${thumb} ${track}`,
            },
            '*::-webkit-scrollbar': {
              width: 10,
              height: 10,
            },
            '*::-webkit-scrollbar-track': {
              backgroundColor: track,
              borderRadius: 10,
            },
            '*::-webkit-scrollbar-thumb': {
              borderRadius: 10,
              backgroundColor: thumb,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },
            '*::-webkit-scrollbar-thumb:hover': {
              backgroundColor: thumbHover,
            },
            '*::-webkit-scrollbar-corner': {
              backgroundColor: track,
            },
          };
        },
      },
    },
  });
