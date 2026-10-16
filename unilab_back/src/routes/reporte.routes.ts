import { Router } from 'express';
import { reporteController } from '../controllers/reporte.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin, checkPerfilPendiente } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';

const router = Router();

const adminCoord = [
  verifyToken,
  checkPrimerLogin,
  checkPerfilPendiente,
  requireRole(['Administrador', 'Coordinador']),
] as const;

router.get('/resumen', ...adminCoord, reporteController.resumen);
router.get('/resumen/export/excel', ...adminCoord, reporteController.exportarExcel);

export default router;
