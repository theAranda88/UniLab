import { Router } from 'express';
import { eventoController } from '../controllers/evento.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import {
  idParamSchema,
  eventoSchema,
  eventoUpdateSchema,
  jornadaSchema,
  inscripcionSchema,
  pagoInscripcionSchema,
  asistenciaSchema,
  evidenciaJornadaParamSchema,
} from '../middlewares/validation/schemas';
import { subirFlyerEvento } from '../middlewares/upload/subirFlyerEvento.middleware';
import { subirEvidenciasJornada } from '../middlewares/upload/subirEvidenciasJornada.middleware';

const router = Router();

const auth = [verifyToken, checkPrimerLogin] as const;
const admin = [...auth, requireRole(['Administrador'])] as const;
const adminCoord = [...auth, requireRole(['Administrador', 'Coordinador'])] as const;
const autenticado = [...auth] as const;

router.get('/', ...autenticado, eventoController.listar);
router.post('/', ...admin, validate(eventoSchema), eventoController.crear);

// Asistencias (debe estar antes de /:id para no ser capturada por el parámetro)
router.post(
  '/asistencias/registrar',
  ...autenticado,
  validate(asistenciaSchema),
  eventoController.registrarAsistencia,
);

// QR (debe estar antes de /:id para no ser capturada por el parámetro)
router.get('/qr/:codigo_qr', ...autenticado, eventoController.generarQR);

router.get('/:id', ...autenticado, validate(idParamSchema, 'params'), eventoController.obtener);
router.post(
  '/:id/flyer',
  ...admin,
  validate(idParamSchema, 'params'),
  subirFlyerEvento,
  eventoController.subirFlyer,
);
router.delete(
  '/:id/flyer',
  ...admin,
  validate(idParamSchema, 'params'),
  eventoController.eliminarFlyer,
);
router.patch(
  '/:id',
  ...admin,
  validate(idParamSchema, 'params'),
  validate(eventoUpdateSchema),
  eventoController.actualizar,
);
router.delete(
  '/:id',
  ...admin,
  validate(idParamSchema, 'params'),
  eventoController.eliminar,
);
router.get(
  '/:id/jornadas',
  ...autenticado,
  validate(idParamSchema, 'params'),
  eventoController.obtenerJornadas,
);
router.post(
  '/:id/jornadas',
  ...admin,
  validate(idParamSchema, 'params'),
  validate(jornadaSchema),
  eventoController.crearJornada,
);
router.get(
  '/:id/mi-inscripcion',
  ...autenticado,
  validate(idParamSchema, 'params'),
  eventoController.obtenerMiInscripcion,
);
router.get(
  '/:id/inscripciones',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  eventoController.listarInscripciones,
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
router.get(
  '/:id/reportes/export/csv',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  eventoController.exportarCSV,
);
router.get(
  '/:id/reportes/export/excel',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  eventoController.exportarExcel,
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
jornadaRouter.get(
  '/:id/evidencias',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  eventoController.listarEvidenciasJornada,
);
jornadaRouter.post(
  '/:id/evidencias',
  ...adminCoord,
  validate(idParamSchema, 'params'),
  subirEvidenciasJornada,
  eventoController.subirEvidenciasJornada,
);
jornadaRouter.delete(
  '/:id/evidencias/:idEvidencia',
  ...adminCoord,
  validate(evidenciaJornadaParamSchema, 'params'),
  eventoController.eliminarEvidenciaJornada,
);
jornadaRouter.post(
  '/:id/asistencia',
  ...autenticado,
  validate(idParamSchema, 'params'),
  validate(asistenciaSchema),
  eventoController.registrarAsistencia,
);
