import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { perfilController } from '../controllers/perfil.controller';
import { validate } from '../middlewares/validation/validate';
import {
  loginSchema,
  registerSchema,
  cambiarPasswordSchema,
  googleLoginSchema,
  completarPerfilSchema,
  formacionSchema,
  formacionParamSchema,
  actualizarMiPerfilSchema,
  cambiarMiPasswordSchema,
} from '../middlewares/validation/schemas';
import { verifyTokenOpcional } from '../middlewares/auth/verifyToken';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin, checkPerfilPendiente } from '../middlewares/auth/checkPrimerLogin';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleLoginSchema), authController.loginGoogle);
router.post('/register', validate(registerSchema), authController.register);
// Sin checkPrimerLogin/checkPerfilPendiente: el front necesita la sesión para redirigir a esos flujos.
router.get('/me', verifyToken, authController.me);
router.patch(
  '/me',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  validate(actualizarMiPerfilSchema),
  authController.actualizarMiPerfil,
);
router.post(
  '/me/perfil-cv/omitir',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  authController.omitirPerfilCv,
);
router.get('/me/formacion', verifyToken, checkPrimerLogin, checkPerfilPendiente, perfilController.listarFormacion);
router.post(
  '/me/formacion',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  validate(formacionSchema),
  perfilController.crearFormacion,
);
router.put(
  '/me/formacion/:idFormacion',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  validate(formacionParamSchema, 'params'),
  validate(formacionSchema),
  perfilController.actualizarFormacion,
);
router.delete(
  '/me/formacion/:idFormacion',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  validate(formacionParamSchema, 'params'),
  perfilController.eliminarFormacion,
);
router.post(
  '/me/password',
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  validate(cambiarMiPasswordSchema),
  authController.cambiarMiPassword,
);
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
