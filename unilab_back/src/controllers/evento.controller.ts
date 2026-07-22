import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { eventoService } from '../services/evento.service';
import { eventoFlyerService } from '../services/evento-flyer.service';
import { eventoJornadaEvidenciaService } from '../services/evento-jornada-evidencia.service';

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

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const evento = await eventoService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(evento);
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await eventoService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),

  listarInscripciones: asyncHandler(async (req: Request, res: Response) => {
    const inscripciones = await eventoService.listarInscripciones(Number(req.params.id));
    res.status(200).json(inscripciones);
  }),

  obtenerMiInscripcion: asyncHandler(async (req: Request, res: Response) => {
    const resultado = await eventoService.obtenerMiInscripcion(
      Number(req.params.id),
      req.user!.id_usuario,
    );
    res.status(200).json(resultado);
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
      req.body.codigo_qr,
      req.user!.id_usuario,
    );
    res.status(201).json(asistencia);
  }),

  reportes: asyncHandler(async (req: Request, res: Response) => {
    const reporte = await eventoService.reportes(Number(req.params.id));
    res.status(200).json(reporte);
  }),

  obtenerJornadas: asyncHandler(async (req: Request, res: Response) => {
    const jornadas = await eventoService.obtenerJornadas(
      Number(req.params.id),
      req.user!.id_usuario,
      req.user!.id_rol,
    );
    res.status(200).json(jornadas);
  }),

  exportarCSV: asyncHandler(async (req: Request, res: Response) => {
    const csv = await eventoService.exportarCSV(Number(req.params.id));
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="reporte_evento_${req.params.id}.csv"`);
    res.send(csv);
  }),

  exportarExcel: asyncHandler(async (req: Request, res: Response) => {
    const excel = await eventoService.exportarExcel(Number(req.params.id));
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="reporte_evento_${req.params.id}.xlsx"`);
    res.send(excel);
  }),

  generarQR: asyncHandler(async (req: Request, res: Response) => {
    const codigo_qr = String(req.params.codigo_qr);
    const formato = (req.query.formato as string) || 'svg';

    const qr = await eventoService.generarQR(codigo_qr, formato as 'svg' | 'png');

    if (formato === 'png') {
      res.header('Content-Type', 'image/png');
      res.send(qr);
    } else {
      res.header('Content-Type', 'image/svg+xml');
      res.send(qr);
    }
  }),

  subirFlyer: asyncHandler(async (req: Request, res: Response) => {
    const resultado = await eventoFlyerService.subir(
      Number(req.params.id),
      req.user!.id_rol,
      req.file as Express.Multer.File,
    );
    res.status(200).json(resultado);
  }),

  eliminarFlyer: asyncHandler(async (req: Request, res: Response) => {
    await eventoFlyerService.eliminar(Number(req.params.id), req.user!.id_rol);
    res.status(204).send();
  }),

  listarEvidenciasJornada: asyncHandler(async (req: Request, res: Response) => {
    const evidencias = await eventoJornadaEvidenciaService.listar(
      Number(req.params.id),
      req.user!.id_rol,
    );
    res.status(200).json(evidencias);
  }),

  subirEvidenciasJornada: asyncHandler(async (req: Request, res: Response) => {
    const evidencias = await eventoJornadaEvidenciaService.subir(
      Number(req.params.id),
      req.user!.id_rol,
      req.user!.id_usuario,
      (req.files as Express.Multer.File[]) ?? [],
    );
    res.status(201).json(evidencias);
  }),

  eliminarEvidenciaJornada: asyncHandler(async (req: Request, res: Response) => {
    await eventoJornadaEvidenciaService.eliminar(
      Number(req.params.id),
      Number(req.params.idEvidencia),
      req.user!.id_rol,
    );
    res.status(204).send();
  }),
};
