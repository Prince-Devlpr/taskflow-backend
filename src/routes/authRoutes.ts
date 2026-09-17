import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validateMiddleware';
import { authenticate } from '../middleware/authMiddleware';
import { registerSchema, loginSchema } from '../validators/authValidator';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
