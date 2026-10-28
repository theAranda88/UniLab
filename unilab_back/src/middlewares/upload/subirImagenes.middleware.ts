import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import {
  IMAGEN_EXTENSION_POR_MIME,
  IMAGEN_MIME_PERMITIDOS,
  MAX_IMAGEN_BYTES,
  asegurarDirectorio,
} from '../../utils/uploadPaths';

interface OpcionesSubidaImagenes {
  /** Campo multipart que trae los archivos. */
  campo: string;
  /** Máximo de archivos por solicitud. */
  maxArchivos: number;
  /** Carpeta destino a partir de la solicitud (p. ej. según `req.params.id`). */
  carpeta: (req: Request) => string;
}

function filtroImagen(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (!IMAGEN_MIME_PERMITIDOS.has(file.mimetype)) {
    cb(new Error('Solo se permiten imágenes JPEG, PNG o WebP'));
    return;
  }
  cb(null, true);
}

/**
 * Middleware de subida compartido: guarda imágenes JPEG/PNG/WebP de hasta 5 MB en la carpeta
 * indicada y traduce los errores de multer a 400 con un mensaje legible.
 */
export function subirImagenes({ campo, maxArchivos, carpeta }: OpcionesSubidaImagenes) {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const dir = carpeta(req);
        asegurarDirectorio(dir);
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext =
          IMAGEN_EXTENSION_POR_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: MAX_IMAGEN_BYTES, files: maxArchivos },
    fileFilter: filtroImagen,
  });

  return (req: Request, res: Response, next: NextFunction): void => {
    upload.array(campo, maxArchivos)(req, res, (err: unknown) => {
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
        res.status(400).json({ error: `Máximo ${maxArchivos} imágenes por solicitud en el campo "${campo}"` });
        return;
      }
      res.status(400).json({ error: multerErr.message ?? 'Error al subir imágenes' });
    });
  };
}
