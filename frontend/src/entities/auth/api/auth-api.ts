import { useAuthStore } from '@/entities/auth/model/auth-store';
import { httpClient } from '@/shared/api/http-client';
import type {
  AuthLoginRequest,
  AuthLogoutRequest,
  AuthRefreshRequest,
  AuthRegisterRequest,
  AuthTokenPairResponse,
  UserMeResponse,
} from '@/shared/types/api';

export const register = async (
  body: AuthRegisterRequest,
): Promise<{ tokens: AuthTokenPairResponse }> => {
  const { data } = await httpClient.post<AuthTokenPairResponse>('/api/auth/register', body, {
    skipAuth: true,
  });
  useAuthStore.getState().setTokens(data);
  return { tokens: data };
};

export const login = async (
  body: AuthLoginRequest,
): Promise<{ tokens: AuthTokenPairResponse }> => {
  const { data } = await httpClient.post<AuthTokenPairResponse>('/api/auth/login', body, {
    skipAuth: true,
  });
  useAuthStore.getState().setTokens(data);
  return { tokens: data };
};

export const refreshTokens = async (
  body: AuthRefreshRequest,
): Promise<AuthTokenPairResponse> => {
  const { data } = await httpClient.post<AuthTokenPairResponse>('/api/auth/refresh', body, {
    skipAuth: true,
  });
  useAuthStore.getState().setTokens(data);
  return data;
};

export const logoutRequest = async (body: AuthLogoutRequest): Promise<void> => {
  await httpClient.post('/api/auth/logout', body, { skipAuth: true });
};

export const fetchCurrentUser = async (): Promise<UserMeResponse> => {
  const { data } = await httpClient.get<UserMeResponse>('/api/auth/me');
  return data;
};
