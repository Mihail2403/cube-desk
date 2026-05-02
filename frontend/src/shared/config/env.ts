import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .min(1)
    .transform((v) => v.replace(/\/$/, ''))
    .pipe(z.string().url()),
});

const raw = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
};

export const env = envSchema.parse(raw);
