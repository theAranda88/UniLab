import path from 'path';
import fs from 'fs';

export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
export const PROYECTO_IMAGENES_DIR = path.join(UPLOADS_ROOT, 'proyectos');

export const IMAGEN_MIME_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const IMAGEN_EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const MAX_IMAGENES_POR_PROYECTO = 3;
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

export function carpetaProyecto(id_proyecto: number): string {
  return path.join(PROYECTO_IMAGENES_DIR, String(id_proyecto));
}

export function rutaPublicaProyecto(id_proyecto: number, nombreArchivo: string): string {
  return `/uploads/proyectos/${id_proyecto}/${nombreArchivo}`;
}

export function asegurarDirectorio(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function urlBaseApi(): string {
  const port = process.env.PORT ?? '3000';
  return process.env.API_PUBLIC_URL ?? `http://localhost:${port}`;
}

export function urlPublicaImagen(ruta_archivo: string): string {
  return `${urlBaseApi()}${ruta_archivo}`;
}
