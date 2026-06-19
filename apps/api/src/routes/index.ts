import { Router } from 'express';

import healthRoutes from './healthRoutes.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', healthRoutes);

export default router;
