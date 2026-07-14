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
};
