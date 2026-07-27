import { Router } from 'express';

import { profileController } from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth); // Auth required

router.get('/', profileController.get); // GET /api/v1/profile
router.patch('/', profileController.updateAvatar); // PATCH /api/v1/profile
router.delete('/', profileController.deactivate); // DELETE /api/v1/profile

export default router;
