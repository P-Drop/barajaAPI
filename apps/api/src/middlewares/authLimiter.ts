import { rateLimit, MemoryStore } from 'express-rate-limit';
import { env } from '../config/env.js';

// Store explícito reseteable
export const authRateLimitStore = new MemoryStore();

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7', // Cabeceras RateLimit-*
  legacyHeaders: false,
  store: authRateLimitStore,
  message: { error: 'Demasiadas peticiones, inténtalo más tarde.' },
});
