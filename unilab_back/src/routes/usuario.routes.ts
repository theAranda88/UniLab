import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import {
  idParamSchema,
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  filtroUsuariosSchema,
} from '../middlewares/validation/schemas';

const router = Router();

router.use(verifyToken, checkPrimerLogin, requireRole(['Administrador']));

router.get('/', validate(filtroUsuariosSchema, 'query'), usuarioController.listar);
router.get('/:id', validate(idParamSchema, 'params'), usuarioController.obtener);
router.post('/', validate(crearUsuarioSchema), usuarioController.crear);
router.patch('/:id', validate(idParamSchema, 'params'), validate(actualizarUsuarioSchema), usuarioController.actualizar);
router.patch('/:id/suspender', validate(idParamSchema, 'params'), usuarioController.suspender);
router.delete('/:id', validate(idParamSchema, 'params'), usuarioController.eliminar);

export default router;
