import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  IMAGEN_EXTENSION_POR_MIME,
  IMAGEN_MIME_PERMITIDOS,
  MAX_IMAGEN_BYTES,
  asegurarDirectorio,
  carpetaEvento,
} from '../../utils/uploadPaths';

function filtroImagen(
  _req: import('express').Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (!IMAGEN_MIME_PERMITIDOS.has(file.mimetype)) {
    cb(new Error('Solo se permiten imágenes JPEG, PNG o WebP'));
    return;
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const id = Number(req.params.id);
    const dir = carpetaEvento(id);
    asegurarDirectorio(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext =
      IMAGEN_EXTENSION_POR_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
    cb(null, `flyer-${randomUUID()}${ext}`);
  },
});

export const eventoFlyerUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGEN_BYTES, files: 1 },
  fileFilter: filtroImagen,
});
