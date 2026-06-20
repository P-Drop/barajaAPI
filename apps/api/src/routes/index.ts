import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import cardRoutes from './cardRoutes.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', healthRoutes);

// API de negocio -> v1
router.use('/v1/deck', cardRoutes);

export default router;
