import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation/validate';
import { loginSchema, registerSchema, cambiarPasswordSchema, googleLoginSchema, completarPerfilSchema } from '../middlewares/validation/schemas';
import { verifyTokenOpcional } from '../middlewares/auth/verifyToken';
import { verifyToken } from '../middlewares/auth/verifyToken';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleLoginSchema), authController.loginGoogle);
router.post('/register', validate(registerSchema), authController.register);
router.post(
  '/completar-perfil',
  verifyToken,
  validate(completarPerfilSchema),
  authController.completarPerfil,
);
router.post(
  '/cambiar-password',
  verifyTokenOpcional,
  validate(cambiarPasswordSchema),
  authController.cambiarPassword,
);

export default router;
