import { Router } from 'express';

import { cardController } from '../controllers/cardController.js';

const router = Router();

router.get('/', cardController.getDeck); // GET /api/v1/deck
router.get('/shuffle', cardController.shuffle); // GET /api/v1/deck/shuffle
router.get('/draw', cardController.draw); // GET /api/v1/deck/draw?count=N

export default router;
