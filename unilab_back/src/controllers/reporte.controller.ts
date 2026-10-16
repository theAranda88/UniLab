import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { reporteService } from '../services/reporte.service';

export const reporteController = {
  resumen: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await reporteService.resumen());
  }),

  exportarExcel: asyncHandler(async (_req: Request, res: Response) => {
    const excel = await reporteService.exportarExcel();
    const fecha = new Date().toISOString().slice(0, 10);
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="reporte_unilab_${fecha}.xlsx"`);
    res.send(excel);
  }),
};
