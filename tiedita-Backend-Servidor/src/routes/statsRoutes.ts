import { Router } from 'express';
import { getStats, getDetailedStats } from '../controllers/statsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getStats);
router.get('/detailed', getDetailedStats);

export default router;
