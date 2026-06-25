import { beforeEach } from 'vitest';
import { rateLimitStore } from '../src/middlewares/rateLimiter.js';

// Contador de rate limit a cero antes de CADA test de la suite
beforeEach(() => {
  rateLimitStore.resetAll();
});
