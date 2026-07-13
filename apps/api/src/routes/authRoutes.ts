import { Router } from 'express';

import { authController } from '../controllers/authController.js';

const router = Router();

router.post('/register', authController.register); // POST /api/v1/auth/register

export default router;
