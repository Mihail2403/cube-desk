import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokenPairResponse } from '@/shared/types/api';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number | null;
  refreshExpiresAt: number | null;
  setTokens: (pair: AuthTokenPairResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      setTokens: (pair) =>
        set({
          accessToken: pair.access_token,
          refreshToken: pair.refresh_token,
          accessExpiresAt: Date.now() + pair.access_expires_in * 1000,
          refreshExpiresAt: Date.now() + pair.refresh_expires_in * 1000,
        }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          accessExpiresAt: null,
          refreshExpiresAt: null,
        }),
    }),
    {
      name: 'cube-desk-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessExpiresAt: state.accessExpiresAt,
        refreshExpiresAt: state.refreshExpiresAt,
      }),
    },
  ),
);
