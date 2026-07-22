import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import { eventoFlyerUpload } from './eventoFlyer.middleware';

export function subirFlyerEvento(req: Request, res: Response, next: NextFunction): void {
  eventoFlyerUpload.single('flyer')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El flyer debe pesar máximo 5 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Use el campo multipart "flyer"' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir flyer' });
  });
}
