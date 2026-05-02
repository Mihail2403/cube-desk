import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (m: ThemeMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
