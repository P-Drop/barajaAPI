import { beforeEach } from 'vitest';
import { resetRateLimits } from './helpers/rateLimits.js';

// Contador de rate limit a cero antes de CADA test de la suite
beforeEach(resetRateLimits);
