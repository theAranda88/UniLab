import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { usuarioService } from '../services/usuario.service';
import { consultaUsuariosSchema } from '../middlewares/validation/schemas';

export const usuarioController = {
  listarRoles: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await usuarioService.listarRoles();
    res.status(200).json(roles);
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const usuarios = await usuarioService.listar(req.query.rol as string | undefined);
    res.status(200).json(usuarios);
  }),

  listarConsulta: asyncHandler(async (req: Request, res: Response) => {
    // Express 5 vuelve a parsear req.query en cada acceso: se toman los valores ya convertidos.
    const filtro = consultaUsuariosSchema.parse(req.query);
    const usuarios = await usuarioService.listarConsulta(req.user!, filtro);
    res.status(200).json(usuarios);
  }),

  estudiantesDeProfesor: asyncHandler(async (req: Request, res: Response) => {
    const result = await usuarioService.estudiantesDeProfesor(req.user!.id_usuario);
    res.status(200).json(result);
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
