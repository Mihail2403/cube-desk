import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ThemeModeContext, type ThemeMode, type ThemeModeContextValue } from '@/shared/context/theme-mode-store';

const STORAGE_KEY = 'cube-desk-theme';

const readInitial = (): ThemeMode => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return 'light';
};

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(readInitial);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      toggleMode,
      setMode,
    }),
    [mode, toggleMode, setMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};
