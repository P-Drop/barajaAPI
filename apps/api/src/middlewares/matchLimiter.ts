import { rateLimit, MemoryStore } from 'express-rate-limit';
import { env } from '../config/env.js';

// Store explícito reseteable
export const matchRateLimitStore = new MemoryStore();

export const matchLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.MATCH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7', // Cabeceras RateLimit-*
  legacyHeaders: false,
  store: matchRateLimitStore,
  message: { error: 'Demasiadas peticiones, inténtalo más tarde.' },
});
