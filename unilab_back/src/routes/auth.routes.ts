import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation/validate';
import { loginSchema, registerSchema, cambiarPasswordSchema } from '../middlewares/validation/schemas';
import { verifyTokenOpcional } from '../middlewares/auth/verifyToken';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post(
  '/cambiar-password',
  verifyTokenOpcional,
  validate(cambiarPasswordSchema),
  authController.cambiarPassword,
);

export default router;
