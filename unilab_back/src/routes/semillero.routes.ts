import { Router } from 'express';
import { semilleroController } from '../controllers/semillero.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import {
  idParamSchema,
  idEstudianteParamSchema,
  semilleroSchema,
  asignarProfesorSemilleroSchema,
  solicitudMembresiaSchema,
  resolverMembresiaSchema,
} from '../middlewares/validation/schemas';

const router = Router();

const auth = [verifyToken, checkPrimerLogin] as const;
const admin = [...auth, requireRole(['Administrador'])] as const;
const estudiante = [...auth, requireRole(['Estudiante'])] as const;
const profesor = [...auth, requireRole(['Profesor'])] as const;
const lectura = [...auth] as const;

router.get('/', ...lectura, semilleroController.listar);
router.get('/:id', ...lectura, validate(idParamSchema, 'params'), semilleroController.obtener);
router.post('/', ...admin, validate(semilleroSchema), semilleroController.crear);
router.patch('/:id', ...admin, validate(idParamSchema, 'params'), semilleroController.actualizar);
router.delete('/:id', ...admin, validate(idParamSchema, 'params'), semilleroController.eliminar);

router.post(
  '/:id/profesores',
  ...admin,
  validate(idParamSchema, 'params'),
  validate(asignarProfesorSemilleroSchema),
  semilleroController.asignarProfesor,
);
router.delete(
  '/:id/profesores/:idProfesor',
  ...admin,
  semilleroController.quitarProfesor,
);

router.post(
  '/:id/miembros',
  ...estudiante,
  validate(idParamSchema, 'params'),
  validate(solicitudMembresiaSchema),
  semilleroController.solicitarMembresia,
);
router.patch(
  '/:id/miembros/:idEstudiante',
  ...profesor,
  validate(idEstudianteParamSchema, 'params'),
  validate(resolverMembresiaSchema),
  semilleroController.resolverMembresia,
);
router.patch(
  '/:id/miembros/:idEstudiante/autorizar-publicacion',
  ...profesor,
  validate(idEstudianteParamSchema, 'params'),
  semilleroController.autorizarPublicacion,
);

export default router;
