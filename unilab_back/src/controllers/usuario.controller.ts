import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { usuarioService } from '../services/usuario.service';

export const usuarioController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const usuarios = await usuarioService.listar(req.query.rol as string | undefined);
    res.status(200).json(usuarios);
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await usuarioService.obtenerPorId(Number(req.params.id));
    res.status(200).json(usuario);
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const result = await usuarioService.crear({
      ...req.body,
      created_by: req.user!.id_usuario,
    });
    res.status(201).json(result);
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await usuarioService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(usuario);
  }),

  suspender: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await usuarioService.suspender(Number(req.params.id));
    res.status(200).json(usuario);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await usuarioService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),
};
