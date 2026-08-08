import { Router } from 'express';
import { matchController } from '../controllers/matchController.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { matchUserLimiter } from '../middlewares/matchUserLimiter.js';

const router = Router();

router.use(requireAuth); // Todas las rutas exigen auth
router.use(matchUserLimiter); // Cuota por jugador (necesita req.user)

router.post('/', matchController.create); // POST /api/v1/matches
router.get('/active', matchController.active); // GET /api/v1/matches/active
router.get('/:id', matchController.get); // GET /api/v1/matches/:id
router.post('/:id/moves', matchController.move); // POST /api/v1/matches/:id/moves

export default router;
