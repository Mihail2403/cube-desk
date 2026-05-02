import axios from 'axios';
import { env } from '@/shared/config/env';
import { setupAuthInterceptors } from '@/shared/api/auth-interceptor';

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupAuthInterceptors(httpClient);
