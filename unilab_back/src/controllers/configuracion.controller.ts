import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { configuracionService } from '../services/configuracion.service';

export const configuracionController = {
  obtener: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await configuracionService.obtenerTodo());
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await configuracionService.actualizar(req.body, req.user!.id_usuario));
  }),
};
