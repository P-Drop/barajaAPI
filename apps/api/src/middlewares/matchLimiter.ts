import { rateLimit, MemoryStore } from 'express-rate-limit';
import { env } from '../config/env.js';

// Store explícito reseteable
export const matchRateLimitStore = new MemoryStore();

// Capa 1 (por IP): escudo anti-abuso. Va ANTES de requireAuth
// Es el único que ve tráfico sin token
export const matchLimiter = rateLimit({
  windowMs: env.MATCH_RATE_LIMIT_WINDOW_MS,
  limit: env.MATCH_IP_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7', // Cabeceras RateLimit-*
  legacyHeaders: false,
  store: matchRateLimitStore,
  message: { error: 'Demasiadas peticiones, inténtalo más tarde.' },
});
