import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  IMAGEN_EXTENSION_POR_MIME,
  IMAGEN_MIME_PERMITIDOS,
  MAX_IMAGEN_BYTES,
  MAX_IMAGENES_POR_PROYECTO,
  asegurarDirectorio,
  carpetaProyecto,
} from '../../utils/uploadPaths';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const id = Number(req.params.id);
    const dir = carpetaProyecto(id);
    asegurarDirectorio(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = IMAGEN_EXTENSION_POR_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

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

export const proyectoImagenesUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGEN_BYTES, files: MAX_IMAGENES_POR_PROYECTO },
  fileFilter: filtroImagen,
});
