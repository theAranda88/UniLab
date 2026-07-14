import { Router } from 'express';
import { proyectoController } from '../controllers/proyecto.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import { subirImagenesProyecto } from '../middlewares/upload/subirImagenesProyecto.middleware';
import {
  idParamSchema,
  imagenProyectoParamSchema,
  proyectoSchema,
  actualizarProyectoSchema,
  estadoProyectoSchema,
  comentarioSchema,
  calificacionSchema,
} from '../middlewares/validation/schemas';

const router = Router();

const auth = [verifyToken, checkPrimerLogin] as const;

router.get('/', ...auth, proyectoController.listar);
router.get('/:id', ...auth, validate(idParamSchema, 'params'), proyectoController.obtener);
router.post(
  '/',
  ...auth,
  requireRole(['Estudiante']),
  validate(proyectoSchema),
  proyectoController.crear,
);
router.patch(
  '/:id',
  ...auth,
  validate(idParamSchema, 'params'),
  validate(actualizarProyectoSchema),
  proyectoController.actualizar,
);
router.delete('/:id', ...auth, validate(idParamSchema, 'params'), proyectoController.eliminar);
router.patch(
  '/:id/estado',
  ...auth,
  validate(idParamSchema, 'params'),
  validate(estadoProyectoSchema),
  proyectoController.cambiarEstado,
);
router.post(
  '/:id/comentarios',
  ...auth,
  validate(idParamSchema, 'params'),
  validate(comentarioSchema),
  proyectoController.comentar,
);
router.put(
  '/:id/calificacion',
  ...auth,
  validate(idParamSchema, 'params'),
  validate(calificacionSchema),
  proyectoController.calificar,
);
router.get(
  '/:id/imagenes',
  ...auth,
  validate(idParamSchema, 'params'),
  proyectoController.listarImagenes,
);
router.post(
  '/:id/imagenes',
  ...auth,
  validate(idParamSchema, 'params'),
  subirImagenesProyecto,
  proyectoController.subirImagenes,
);
router.delete(
  '/:id/imagenes/:idImagen',
  ...auth,
  validate(imagenProyectoParamSchema, 'params'),
  proyectoController.eliminarImagen,
);

export default router;
