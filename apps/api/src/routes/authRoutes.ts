import { Router } from 'express';

import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/register', authController.register); // POST /api/v1/auth/register
router.post('/login', authController.login); // POST /api/v1/auth/login
router.get('/me', requireAuth, authController.me);

export default router;
