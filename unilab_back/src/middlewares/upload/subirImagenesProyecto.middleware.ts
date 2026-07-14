import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import { proyectoImagenesUpload } from './proyectoImagenes.middleware';

export function subirImagenesProyecto(req: Request, res: Response, next: NextFunction): void {
  proyectoImagenesUpload.array('imagenes', 3)(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Cada imagen debe pesar máximo 5 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_FILE_COUNT' || multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Máximo 3 imágenes por solicitud' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir imágenes' });
  });
}
