import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import cardRoutes from './cardRoutes.js';

import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', healthRoutes);

// API de negocio -> v1
router.use('/v1/deck', apiLimiter, cardRoutes);

export default router;
