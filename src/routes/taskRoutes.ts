import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody, validateQuery } from '../middleware/validateMiddleware';
import { createLimiter } from '../middleware/rateLimiters';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../validators/taskValidator';

const router = Router();

// Protect all task routes with JWT authentication
router.use(authenticate);

// Statistics
router.get('/stats', TaskController.getStats);

// Tasks CRUD
router.get('/', validateQuery(taskQuerySchema), TaskController.getTasks);
router.post('/', createLimiter, validateBody(createTaskSchema), TaskController.createTask);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', validateBody(updateTaskSchema), TaskController.updateTask);
router.patch('/:id/complete', TaskController.toggleComplete);
router.delete('/:id', TaskController.deleteTask);

export default router;
