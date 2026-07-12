import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { semilleroService } from '../services/semillero.service';

export const semilleroController = {
  listar: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await semilleroService.listar());
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await semilleroService.obtener(Number(req.params.id)));
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const semillero = await semilleroService.crear({
      ...req.body,
      created_by: req.user!.id_usuario,
    });
    res.status(201).json(semillero);
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const semillero = await semilleroService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(semillero);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await semilleroService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),

  asignarProfesor: asyncHandler(async (req: Request, res: Response) => {
    const asignacion = await semilleroService.asignarProfesor(
      Number(req.params.id),
      req.body.id_profesor,
      req.user!.id_usuario,
      req.body.es_lider,
    );
    res.status(201).json(asignacion);
  }),

  quitarProfesor: asyncHandler(async (req: Request, res: Response) => {
    await semilleroService.quitarProfesor(Number(req.params.id), Number(req.params.idProfesor));
    res.status(204).send();
  }),

  solicitarMembresia: asyncHandler(async (req: Request, res: Response) => {
    const idEstudiante = req.body.id_estudiante ?? req.user!.id_usuario;
    const membresia = await semilleroService.solicitarMembresia(Number(req.params.id), idEstudiante);
    res.status(201).json(membresia);
  }),

  resolverMembresia: asyncHandler(async (req: Request, res: Response) => {
    const membresia = await semilleroService.resolverMembresia(
      Number(req.params.id),
      Number(req.params.idEstudiante),
      req.user!.id_usuario,
      req.body.estado_solicitud,
    );
    res.status(200).json(membresia);
  }),

  autorizarPublicacion: asyncHandler(async (req: Request, res: Response) => {
    const membresia = await semilleroService.autorizarPublicacion(
      Number(req.params.id),
      Number(req.params.idEstudiante),
      req.user!.id_usuario,
    );
    res.status(200).json(membresia);
  }),
};
