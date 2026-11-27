import { Router } from 'express';
import { certificadoController } from '../controllers/certificado.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin, checkPerfilPendiente } from '../middlewares/auth/checkPrimerLogin';
import { validate } from '../middlewares/validation/validate';
import { idParamSchema } from '../middlewares/validation/schemas';

const router = Router();

const autenticado = [verifyToken, checkPrimerLogin, checkPerfilPendiente] as const;

// Los permisos finos (titular, organizador o administrador) los valida el servicio
router.get('/mios', ...autenticado, certificadoController.misCertificados);
router.get('/:id/pdf', ...autenticado, validate(idParamSchema, 'params'), certificadoController.descargar);
router.delete('/:id', ...autenticado, validate(idParamSchema, 'params'), certificadoController.anular);

export default router;
