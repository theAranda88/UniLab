import { Router } from 'express';
import authRoutes from './auth.routes';
import usuarioRoutes from './usuario.routes';
import profesorRoutes from './profesor.routes';
import escuelaRoutes from './escuela.routes';
import proyectoRoutes, { comentarioRouter } from './proyecto.routes';
import semilleroRoutes from './semillero.routes';
import eventoRoutes, { inscripcionRouter, jornadaRouter } from './evento.routes';
import publicoRoutes from './publico.routes';
import reporteRoutes from './reporte.routes';
import configuracionRoutes from './configuracion.routes';

const router = Router();

router.use('/public', publicoRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/profesores', profesorRoutes);
router.use('/', escuelaRoutes);
router.use('/proyectos', proyectoRoutes);
router.use('/comentarios', comentarioRouter);
router.use('/semilleros', semilleroRoutes);
router.use('/eventos', eventoRoutes);
router.use('/inscripciones', inscripcionRouter);
router.use('/jornadas', jornadaRouter);
router.use('/reportes', reporteRoutes);
router.use('/configuracion', configuracionRoutes);

export default router;
