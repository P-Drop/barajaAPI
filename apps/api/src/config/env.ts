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
  // db
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  // Mode
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Pino Logger
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  // Rate Limit
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  // Rate Limit Partidas -> 120/min
  MATCH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(1 * 60 * 1000),
  MATCH_RATE_LIMIT_MAX: z.coerce.number().default(120), // por jugador
  MATCH_IP_RATE_LIMIT_MAX: z.coerce.number().default(300), // por IP
  // Sentry
  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Expiración partidas automática
  MATCH_TTL_MINUTES: z.coerce.number().int().positive().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:\n');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
