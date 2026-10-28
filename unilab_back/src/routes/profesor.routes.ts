import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin, checkPerfilPendiente } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';

const router = Router();

router.use(verifyToken, checkPrimerLogin, checkPerfilPendiente, requireRole(['Profesor']));

router.get('/me/estudiantes', usuarioController.estudiantesDeProfesor);

export default router;
