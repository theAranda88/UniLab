import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { perfilService } from '../services/perfil.service';

export const perfilController = {
  listarFormacion: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await perfilService.listarFormacion(req.user!.id_usuario));
  }),

  crearFormacion: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await perfilService.crearFormacion(req.user!.id_usuario, req.body));
  }),

  actualizarFormacion: asyncHandler(async (req: Request, res: Response) => {
    res
      .status(200)
      .json(await perfilService.actualizarFormacion(req.user!.id_usuario, Number(req.params.idFormacion), req.body));
  }),

  eliminarFormacion: asyncHandler(async (req: Request, res: Response) => {
    await perfilService.eliminarFormacion(req.user!.id_usuario, Number(req.params.idFormacion));
    res.status(204).send();
  }),

  perfilPublico: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await perfilService.perfilPublico(Number(req.params.id)));
  }),
};
