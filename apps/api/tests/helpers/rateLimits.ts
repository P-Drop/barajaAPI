import { rateLimitStore } from '../../src/middlewares/rateLimiter.js';
import { authRateLimitStore } from '../../src/middlewares/authLimiter.js';
import { matchRateLimitStore } from '../../src/middlewares/matchLimiter.js';
import { matchUserRateLimitStore } from '../../src/middlewares/matchUserLimiter.js';

// Único sitio que conoce TODOS los limiters. Al añadir uno nuevo se registra
// aquí y queda cubierto tanto por el setup global como por los resets manuales
// de los tests que necesitan hacer sitio a mitad de un caso.
export const resetRateLimits = () => {
  rateLimitStore.resetAll();
  authRateLimitStore.resetAll();
  matchRateLimitStore.resetAll();
  matchUserRateLimitStore.resetAll();
};
