import { config as loadEnv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

expand(loadEnv());

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((v) => (v === '*' ? v : v.split(',').map((s) => s.trim()))),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:\n');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
