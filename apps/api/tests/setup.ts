import { beforeEach } from 'vitest';
import { rateLimitStore } from '../src/middlewares/rateLimiter.js';
import { authRateLimitStore } from '../src/middlewares/authLimiter.js';
import { matchRateLimitStore } from '../src/middlewares/matchLimiter.js';

// Contador de rate limit a cero antes de CADA test de la suite
beforeEach(() => {
  rateLimitStore.resetAll();
  authRateLimitStore.resetAll();
  matchRateLimitStore.resetAll();
});
