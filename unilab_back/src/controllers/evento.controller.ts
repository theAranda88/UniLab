import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { eventoService } from '../services/evento.service';

export const eventoController = {
  listar: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await eventoService.listar());
  }),

  obtener: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await eventoService.obtener(Number(req.params.id)));
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const evento = await eventoService.crear({
      ...req.body,
      id_organizador: req.user!.id_usuario,
      created_by: req.user!.id_usuario,
    });
    res.status(201).json(evento);
  }),

  crearJornada: asyncHandler(async (req: Request, res: Response) => {
    const jornada = await eventoService.crearJornada(
      Number(req.params.id),
      req.body,
      req.user!.id_usuario,
    );
    res.status(201).json(jornada);
  }),

  inscribir: asyncHandler(async (req: Request, res: Response) => {
    const inscripcion = await eventoService.inscribir(
      Number(req.params.id),
      req.user!.id_usuario,
      req.body,
    );
    res.status(201).json(inscripcion);
  }),

  actualizarPago: asyncHandler(async (req: Request, res: Response) => {
    const inscripcion = await eventoService.actualizarPago(
      Number(req.params.id),
      req.body.estado_pago,
    );
    res.status(200).json(inscripcion);
  }),

  registrarAsistencia: asyncHandler(async (req: Request, res: Response) => {
    const asistencia = await eventoService.registrarAsistencia(
      Number(req.params.id),
      req.user!.id_usuario,
      req.body.codigo_qr,
    );
    res.status(201).json(asistencia);
  }),

  reportes: asyncHandler(async (req: Request, res: Response) => {
    const reporte = await eventoService.reportes(Number(req.params.id));
    res.status(200).json(reporte);
  }),
};
