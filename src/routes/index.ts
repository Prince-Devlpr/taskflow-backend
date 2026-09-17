import { Router } from 'express';
import authRoutes from './authRoutes';
import taskRoutes from './taskRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TaskFlow Backend API',
  });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

export default router;
