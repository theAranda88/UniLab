import { Router } from 'express';
import authRoutes from './auth.routes';
import usuarioRoutes from './usuario.routes';
import escuelaRoutes from './escuela.routes';
import proyectoRoutes from './proyecto.routes';
import semilleroRoutes from './semillero.routes';
import eventoRoutes, { inscripcionRouter, jornadaRouter } from './evento.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/', escuelaRoutes);
router.use('/proyectos', proyectoRoutes);
router.use('/semilleros', semilleroRoutes);
router.use('/eventos', eventoRoutes);
router.use('/inscripciones', inscripcionRouter);
router.use('/jornadas', jornadaRouter);

export default router;
