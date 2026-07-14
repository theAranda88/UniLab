import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { proyectoService } from '../services/proyecto.service';
import { proyectoImagenService } from '../services/proyecto-imagen.service';

export const proyectoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const proyectos = await proyectoService.listar(req.user!.id_rol, req.user!.id_usuario);
    res.status(200).json(proyectos);
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await proyectoService.obtener(Number(req.params.id), req.user?.id_usuario);
    res.status(200).json(proyecto);
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await proyectoService.crear({
      ...req.body,
      id_estudiante: req.user!.id_usuario,
    });
    res.status(201).json(proyecto);
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await proyectoService.actualizar(
      Number(req.params.id),
      req.user!.id_rol,
      req.user!.id_usuario,
      req.body,
    );
    res.status(200).json(proyecto);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await proyectoService.eliminar(Number(req.params.id), req.user!.id_rol, req.user!.id_usuario);
    res.status(204).send();
  }),

  cambiarEstado: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await proyectoService.cambiarEstado(
      Number(req.params.id),
      req.user!.id_rol,
      req.user!.id_usuario,
      req.body.estado_proyecto,
    );
    res.status(200).json(proyecto);
  }),

  comentar: asyncHandler(async (req: Request, res: Response) => {
    const comentario = await proyectoService.comentar(
      Number(req.params.id),
      req.user!.id_usuario,
      req.body.contenido,
      req.body.id_comentario_padre,
    );
    res.status(201).json(comentario);
  }),

  calificar: asyncHandler(async (req: Request, res: Response) => {
    const calificacion = await proyectoService.calificar(
      Number(req.params.id),
      req.user!.id_usuario,
      req.body.puntuacion,
    );
    res.status(200).json(calificacion);
  }),

  listarImagenes: asyncHandler(async (req: Request, res: Response) => {
    const imagenes = await proyectoImagenService.listar(Number(req.params.id));
    res.status(200).json(imagenes);
  }),

  subirImagenes: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const imagenes = await proyectoImagenService.subir(
      Number(req.params.id),
      req.user!.id_rol,
      req.user!.id_usuario,
      files,
    );
    res.status(201).json(imagenes);
  }),

  eliminarImagen: asyncHandler(async (req: Request, res: Response) => {
    await proyectoImagenService.eliminar(
      Number(req.params.id),
      Number(req.params.idImagen),
      req.user!.id_rol,
      req.user!.id_usuario,
    );
    res.status(204).send();
  }),
};
