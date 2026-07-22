import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import { jornadaEvidenciasUpload } from './jornadaEvidencias.middleware';

export function subirEvidenciasJornada(req: Request, res: Response, next: NextFunction): void {
  jornadaEvidenciasUpload.array('evidencias', 3)(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Cada evidencia debe pesar máximo 5 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_FILE_COUNT' || multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Máximo 3 evidencias por solicitud' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir evidencias' });
  });
}
