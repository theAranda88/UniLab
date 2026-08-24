import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { publicoService } from '../services/publico.service';

export const publicoController = {
  listarEscuelas: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await publicoService.listarEscuelas());
  }),

  listarCursos: asyncHandler(async (req: Request, res: Response) => {
    const id_escuela = req.query.id_escuela ? Number(req.query.id_escuela) : undefined;
    res.status(200).json(await publicoService.listarCursos(id_escuela));
  }),

  listarProyectos: asyncHandler(async (req: Request, res: Response) => {
    const id_escuela = req.query.id_escuela ? Number(req.query.id_escuela) : undefined;
    res.status(200).json(await publicoService.listarProyectosPublicados(id_escuela));
  }),

  obtenerProyecto: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await publicoService.obtenerProyectoPublico(Number(req.params.id)));
  }),

  listarEventos: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await publicoService.listarEventosActivos());
  }),

  obtenerEvento: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await publicoService.obtenerEventoActivo(Number(req.params.id)));
  }),

  inscribirEvento: asyncHandler(async (req: Request, res: Response) => {
    const inscripcion = await publicoService.inscribirEvento(
      Number(req.params.id),
      req.body,
    );
    res.status(201).json(inscripcion);
  }),

  consultarInscripcionEvento: asyncHandler(async (req: Request, res: Response) => {
    const resultado = await publicoService.consultarInscripcionEvento(
      Number(req.params.id),
      String(req.query.documento_identidad),
    );
    res.status(200).json(resultado);
  }),

  registrarAsistenciaEvento: asyncHandler(async (req: Request, res: Response) => {
    const asistencia = await publicoService.registrarAsistenciaEvento(
      req.body.codigo_qr,
      req.body.documento_identidad,
    );
    res.status(201).json(asistencia);
  }),
};
