import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { escuelaRepository } from '../models/escuela.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';
import {
  MAX_IMAGENES_POR_ESCUELA,
  rutaPublicaEscuela,
  urlPublicaImagen,
} from '../utils/uploadPaths';

interface EscuelaImagenRow {
  id_imagen: number;
  id_escuela: number;
  ruta_archivo: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

export interface EscuelaImagenDto extends EscuelaImagenRow {
  url: string;
}

function mapImagen(imagen: EscuelaImagenRow): EscuelaImagenDto {
  return {
    id_imagen: imagen.id_imagen,
    id_escuela: imagen.id_escuela,
    ruta_archivo: imagen.ruta_archivo,
    nombre_original: imagen.nombre_original,
    mime_type: imagen.mime_type,
    orden: imagen.orden,
    url: urlPublicaImagen(imagen.ruta_archivo),
  };
}

function descartarArchivos(files: Express.Multer.File[]): void {
  for (const file of files) {
    fs.unlink(file.path, () => undefined);
  }
}

export const escuelaImagenService = {
  mapImagen,
  mapImagenes(imagenes: EscuelaImagenRow[]): EscuelaImagenDto[] {
    return imagenes.map(mapImagen);
  },

  async subir(id_escuela: number, id_usuario: number, files: Express.Multer.File[]) {
    if (!files.length) {
      throw new AppError('Debe enviar al menos un archivo de imagen', 400);
    }

    const escuela = await escuelaRepository.findById(id_escuela);
    if (!escuela) {
      descartarArchivos(files);
      throw new AppError('Escuela no encontrada', 404);
    }

    const existentes = await prisma.escuela_imagenes.count({
      where: { id_escuela, ...activo },
    });

    if (existentes + files.length > MAX_IMAGENES_POR_ESCUELA) {
      descartarArchivos(files);
      throw new AppError(`Máximo ${MAX_IMAGENES_POR_ESCUELA} imágenes por escuela`, 422);
    }

    const creadas = await prisma.$transaction(async (tx) => {
      const registros = [];
      let orden = existentes + 1;

      for (const file of files) {
        const imagen = await tx.escuela_imagenes.create({
          data: {
            id_escuela,
            ruta_archivo: rutaPublicaEscuela(id_escuela, path.basename(file.path)),
            nombre_original: file.originalname,
            mime_type: file.mimetype,
            orden,
            created_by: id_usuario,
          },
        });
        registros.push(imagen);
        orden += 1;
      }

      return registros;
    });

    return this.mapImagenes(creadas);
  },

  async eliminar(id_escuela: number, id_imagen: number) {
    const imagen = await prisma.escuela_imagenes.findFirst({
      where: { id_imagen, id_escuela, ...activo },
    });
    if (!imagen) throw new AppError('Imagen no encontrada', 404);

    await prisma.$transaction(async (tx) => {
      await tx.escuela_imagenes.update({
        where: { id_imagen },
        data: { deleted_at: new Date() },
      });

      // Reordena las restantes para que el orden siga siendo 1..n
      const restantes = await tx.escuela_imagenes.findMany({
        where: { id_escuela, ...activo },
        orderBy: { orden: 'asc' },
      });

      for (let i = 0; i < restantes.length; i += 1) {
        const img = restantes[i];
        if (img.orden !== i + 1) {
          await tx.escuela_imagenes.update({
            where: { id_imagen: img.id_imagen },
            data: { orden: i + 1 },
          });
        }
      }
    });

    const rutaFisica = path.join(process.cwd(), imagen.ruta_archivo.replace(/^\//, ''));
    fs.unlink(rutaFisica, () => undefined);
  },
};
