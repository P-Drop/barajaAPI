import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

// Store explícito reseteable
export const matchUserRateLimitStore = new MemoryStore();

// Capa 2 (por jugador): va DESPUÉS de requireAuth -> req.user existe siempre
// Cuota por usuario, no por IP -> usuarios bajo mismo NAT no se estrangulan
export const matchUserLimiter = rateLimit({
  windowMs: env.MATCH_RATE_LIMIT_WINDOW_MS,
  limit: env.MATCH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7', // Cabeceras RateLimit-*
  legacyHeaders: false,
  store: matchUserRateLimitStore,
  // El fallback a IP es defensivo (req.user opcional en el tipo)
  // rama inalcanzable tras requireAuth -> ipKeyGenerator recorta la IPv6 a su /56
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: { error: 'Demasiadas peticiones, inténtalo más tarde.' },
});
