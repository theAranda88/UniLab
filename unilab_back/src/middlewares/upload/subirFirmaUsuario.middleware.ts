import { randomUUID } from 'crypto';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import type { MulterError } from 'multer';
import { MAX_FOTO_PERFIL_BYTES, asegurarDirectorio, carpetaUsuario } from '../../utils/uploadPaths';

/** El PDF del certificado solo admite PNG y JPEG; PNG con fondo transparente se ve mejor. */
const FIRMA_EXTENSION_POR_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

const storage = multer.diskStorage({
  // Va después de verifyToken: la carpeta es la del usuario en sesión
  destination: (req, _file, cb) => {
    const dir = carpetaUsuario(req.user!.id_usuario);
    asegurarDirectorio(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `firma-${randomUUID()}${FIRMA_EXTENSION_POR_MIME[file.mimetype]}`);
  },
});

const firmaUpload = multer({
  storage,
  limits: { fileSize: MAX_FOTO_PERFIL_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!FIRMA_EXTENSION_POR_MIME[file.mimetype]) {
      cb(new Error('La firma debe ser una imagen PNG o JPEG'));
      return;
    }
    cb(null, true);
  },
});

export function subirFirmaUsuario(req: Request, res: Response, next: NextFunction): void {
  firmaUpload.single('firma')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const multerErr = err as MulterError & { message?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'La firma debe pesar máximo 2 MB' });
      return;
    }
    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Use el campo multipart "firma"' });
      return;
    }
    res.status(400).json({ error: multerErr.message ?? 'Error al subir la firma' });
  });
}
