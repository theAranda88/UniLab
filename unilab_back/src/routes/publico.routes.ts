import { Router } from 'express';
import { publicoController } from '../controllers/publico.controller';
import { validate } from '../middlewares/validation/validate';
import { idParamSchema } from '../middlewares/validation/schemas';
import { z } from 'zod';

const router = Router();

const escuelaQuerySchema = z.object({
  id_escuela: z.coerce.number().int().positive().optional(),
});

router.get('/escuelas', publicoController.listarEscuelas);
router.get(
  '/cursos',
  validate(escuelaQuerySchema, 'query'),
  publicoController.listarCursos,
);
router.get(
  '/proyectos',
  validate(escuelaQuerySchema, 'query'),
  publicoController.listarProyectos,
);
router.get(
  '/proyectos/:id',
  validate(idParamSchema, 'params'),
  publicoController.obtenerProyecto,
);

export default router;
