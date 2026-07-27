import { Router } from 'express';
import { rankingController } from '../controllers/rankingController.js';

const router = Router();

// público
router.get('/', rankingController.get); // GET /api/v1/ranking

export default router;
