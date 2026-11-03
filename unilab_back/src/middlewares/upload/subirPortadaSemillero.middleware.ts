import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import { semilleroPortadaUpload } from './semilleroPortada.middleware';

export function subirPortadaSemillero(req: Request, res: Response, next: NextFunction): void {
  semilleroPortadaUpload.single('portada')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'La portada debe pesar máximo 5 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Use el campo multipart "portada"' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir portada' });
  });
}
