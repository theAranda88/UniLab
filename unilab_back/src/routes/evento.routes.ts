import { Router } from 'express';
import { eventoController } from '../controllers/evento.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import {
  idParamSchema,
  eventoSchema,
  jornadaSchema,
  inscripcionSchema,
  pagoInscripcionSchema,
  asistenciaSchema,
} from '../middlewares/validation/schemas';

const router = Router();

const auth = [verifyToken, checkPrimerLogin] as const;
const admin = [...auth, requireRole(['Administrador'])] as const;
const adminCoord = [...auth, requireRole(['Administrador', 'Coordinador'])] as const;
const autenticado = [...auth] as const;

router.get('/', ...autenticado, eventoController.listar);
router.get('/:id', ...autenticado, validate(idParamSchema, 'params'), eventoController.obtener);
router.post('/', ...admin, validate(eventoSchema), eventoController.crear);
router.post(
  '/:id/jornadas',
  ...admin,
  validate(idParamSchema, 'params'),
  validate(jornadaSchema),
  eventoController.crearJornada,
);
router.post(
  '/:id/inscripciones',
  ...autenticado,
  validate(idParamSchema, 'params'),
  validate(inscripcionSchema),
  eventoController.inscribir,
);
router.get(
  '/:id/reportes',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  eventoController.reportes,
);

export default router;

// Inscripciones y jornadas en rutas separadas
export const inscripcionRouter = Router();
inscripcionRouter.patch(
  '/:id/pago',
  ...admin,
  validate(idParamSchema, 'params'),
  validate(pagoInscripcionSchema),
  eventoController.actualizarPago,
);

export const jornadaRouter = Router();
jornadaRouter.post(
  '/:id/asistencia',
  ...autenticado,
  validate(idParamSchema, 'params'),
  validate(asistenciaSchema),
  eventoController.registrarAsistencia,
);
