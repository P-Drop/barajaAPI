import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import cardRoutes from './cardRoutes.js';
import authRoutes from './authRoutes.js';

import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', healthRoutes);

// API de negocio -> v1
router.use('/v1/deck', apiLimiter, cardRoutes);

// Gestión de usuarios
router.use('/v1/auth', apiLimiter, authRoutes);

export default router;
