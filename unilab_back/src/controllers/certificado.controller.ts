import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { certificadoService } from '../services/certificado.service';

function enviarPdf(res: Response, { archivo, pdf }: { archivo: string; pdf: Buffer }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${archivo}"`);
  res.status(200).send(pdf);
}

export const certificadoController = {
  resumenEvento: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await certificadoService.resumenEvento(Number(req.params.id), req.user!));
  }),

  emitir: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await certificadoService.emitir(Number(req.params.id), req.user!));
  }),

  anular: asyncHandler(async (req: Request, res: Response) => {
    await certificadoService.anular(Number(req.params.id), req.user!);
    res.status(204).send();
  }),

  misCertificados: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await certificadoService.misCertificados(req.user!.id_usuario));
  }),

  descargar: asyncHandler(async (req: Request, res: Response) => {
    enviarPdf(res, await certificadoService.pdfAutenticado(Number(req.params.id), req.user!));
  }),

  descargarPublico: asyncHandler(async (req: Request, res: Response) => {
    const { documento_identidad, email } = req.body as { documento_identidad: string; email: string };
    enviarPdf(res, await certificadoService.pdfPublico(Number(req.params.id), documento_identidad, email));
  }),

  verificar: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await certificadoService.verificar(String(req.params.codigo)));
  }),
};
