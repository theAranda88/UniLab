import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { escuelaService, cursoService } from '../services/escuela.service';
import { escuelaImagenService } from '../services/escuela-imagen.service';

export const escuelaController = {
  listar: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await escuelaService.listar());
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await escuelaService.obtener(Number(req.params.id)));
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const escuela = await escuelaService.crear(req.body, req.user!.id_usuario);
    res.status(201).json(escuela);
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const escuela = await escuelaService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(escuela);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await escuelaService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),

  subirImagenes: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const imagenes = await escuelaImagenService.subir(
      Number(req.params.id),
      req.user!.id_usuario,
      files,
    );
    res.status(201).json(imagenes);
  }),

  eliminarImagen: asyncHandler(async (req: Request, res: Response) => {
    await escuelaImagenService.eliminar(Number(req.params.id), Number(req.params.idImagen));
    res.status(204).send();
  }),
};

export const cursoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const id_escuela = req.query.id_escuela ? Number(req.query.id_escuela) : undefined;
    res.status(200).json(await cursoService.listar(id_escuela));
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await cursoService.obtener(Number(req.params.id)));
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const curso = await cursoService.crear({ ...req.body, created_by: req.user!.id_usuario });
    res.status(201).json(curso);
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const curso = await cursoService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(curso);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await cursoService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),

  autorizar: asyncHandler(async (req: Request, res: Response) => {
    const auth = await cursoService.autorizarEstudiante(
      Number(req.params.id),
      req.body.id_estudiante,
      req.user!.id_usuario,
    );
    res.status(201).json(auth);
  }),

  listarCoordinadoresDisponibles: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(
      await cursoService.listarCoordinadoresDisponibles(Number(req.params.id)),
    );
  }),
};
