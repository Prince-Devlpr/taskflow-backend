import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validateMiddleware';
import { authenticate } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiters';
import { registerSchema, loginSchema } from '../validators/authValidator';

const router = Router();

// Brute-force protection on all authentication endpoints.
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
