import { Router } from 'express';
import { escuelaController, cursoController } from '../controllers/escuela.controller';
import { verifyToken } from '../middlewares/auth/verifyToken';
import { checkPrimerLogin } from '../middlewares/auth/checkPrimerLogin';
import { requireRole } from '../middlewares/roles/requireRole';
import { validate } from '../middlewares/validation/validate';
import {
  idParamSchema,
  escuelaSchema,
  cursoSchema,
  autorizacionCursoSchema,
} from '../middlewares/validation/schemas';

const router = Router();

const auth = [verifyToken, checkPrimerLogin] as const;
const admin = [...auth, requireRole(['Administrador'])] as const;
const profesor = [...auth, requireRole(['Profesor'])] as const;
const lectura = [...auth] as const;

// Escuelas
router.get('/escuelas', ...lectura, escuelaController.listar);
router.get('/escuelas/:id', ...lectura, validate(idParamSchema, 'params'), escuelaController.obtener);
router.post('/escuelas', ...admin, validate(escuelaSchema), escuelaController.crear);
router.patch('/escuelas/:id', ...admin, validate(idParamSchema, 'params'), validate(escuelaSchema), escuelaController.actualizar);
router.delete('/escuelas/:id', ...admin, validate(idParamSchema, 'params'), escuelaController.eliminar);

// Cursos
router.get('/cursos', ...lectura, cursoController.listar);
router.get('/cursos/:id', ...lectura, validate(idParamSchema, 'params'), cursoController.obtener);
router.post('/cursos', ...admin, validate(cursoSchema), cursoController.crear);
router.patch('/cursos/:id', ...admin, validate(idParamSchema, 'params'), cursoController.actualizar);
router.delete('/cursos/:id', ...admin, validate(idParamSchema, 'params'), cursoController.eliminar);
router.post(
  '/cursos/:id/autorizaciones',
  ...profesor,
  validate(idParamSchema, 'params'),
  validate(autorizacionCursoSchema),
  cursoController.autorizar,
);

export default router;
