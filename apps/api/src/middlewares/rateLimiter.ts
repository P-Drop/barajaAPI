import { rateLimit, MemoryStore } from 'express-rate-limit';
import { env } from '../config/env.js';

// Store explícito reseteable
export const rateLimitStore = new MemoryStore(); 

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7', // Cabeceras RateLimit-*
  legacyHeaders: false,
  store: rateLimitStore,
  message: { error: 'Demasiadas peticiones, inténtalo más tarde.' },
});
