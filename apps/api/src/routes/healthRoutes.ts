import { Router } from 'express';

import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/', healthController.check);
router.get('/ready', healthController.ready);

export default router;
