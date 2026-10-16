import { Router } from 'express';
import { configuracionController } from '../controllers/configuracion.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin, checkPerfilPendiente } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import { configuracionUpdateSchema } from '../middlewares/validation/schemas';

const router = Router();

const admin = [
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  requireRole(['Administrador']),
] as const;

router.get('/', ...admin, configuracionController.obtener);
router.patch('/', ...admin, validate(configuracionUpdateSchema), configuracionController.actualizar);

export default router;
