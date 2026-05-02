import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { useAuthStore } from '@/entities/auth/model/auth-store';
import { env } from '@/shared/config/env';
import type { AuthTokenPairResponse } from '@/shared/types/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
    else p.reject(new Error('No access token after refresh'));
  });
  failedQueue = [];
};

const refreshClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const setupAuthInterceptors = (client: AxiosInstance): void => {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    }
    if (config.skipAuth) return config;
    const access = useAuthStore.getState().accessToken;
    if (access) {
      config.headers.set('Authorization', `Bearer ${access}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
      if (!originalRequest) return Promise.reject(error);

      const status = error.response?.status;
      if (status !== 401 || originalRequest.skipAuth || originalRequest._retry) {
        return Promise.reject(error);
      }

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            return client(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post<AuthTokenPairResponse>('/api/auth/refresh', {
          refresh_token: refreshToken,
        });
        useAuthStore.getState().setTokens(data);
        processQueue(null, data.access_token);
        originalRequest.headers.set('Authorization', `Bearer ${data.access_token}`);
        return client(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clear();
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    },
  );
};
