import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import {
  IMAGEN_EXTENSION_POR_MIME,
  IMAGEN_MIME_PERMITIDOS,
  MAX_IMAGEN_BYTES,
  asegurarDirectorio,
  carpetaUsuario,
} from '../../utils/uploadPaths';

const storage = multer.diskStorage({
  // Va después de verifyToken: la carpeta es la del usuario en sesión
  destination: (req, _file, cb) => {
    const dir = carpetaUsuario(req.user!.id_usuario);
    asegurarDirectorio(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext =
      IMAGEN_EXTENSION_POR_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
    cb(null, `foto-${randomUUID()}${ext}`);
  },
});

const fotoUsuarioUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGEN_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGEN_MIME_PERMITIDOS.has(file.mimetype)) {
      cb(new Error('Solo se permiten imágenes JPEG, PNG o WebP'));
      return;
    }
    cb(null, true);
  },
});

export function subirFotoUsuario(req: Request, res: Response, next: NextFunction): void {
  fotoUsuarioUpload.single('foto')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'La foto debe pesar máximo 5 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Use el campo multipart "foto"' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir la foto' });
  });
}
