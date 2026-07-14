import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { proyectoRepository } from '../models/proyecto.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';
import {
  MAX_IMAGENES_POR_PROYECTO,
  rutaPublicaProyecto,
  urlPublicaImagen,
} from '../utils/uploadPaths';

export interface ProyectoImagenDto {
  id_imagen: number;
  id_proyecto: number;
  ruta_archivo: string;
  url: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

function mapImagen(imagen: {
  id_imagen: number;
  id_proyecto: number;
  ruta_archivo: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}): ProyectoImagenDto {
  return {
    ...imagen,
    url: urlPublicaImagen(imagen.ruta_archivo),
  };
}

async function sincronizarUrlImagenPortada(id_proyecto: number): Promise<void> {
  const primera = await prisma.proyecto_imagenes.findFirst({
    where: { id_proyecto, ...activo },
    orderBy: { orden: 'asc' },
  });
  await proyectoRepository.update(id_proyecto, {
    url_imagen: primera ? urlPublicaImagen(primera.ruta_archivo) : null,
  });
}

async function verificarPermisoImagenes(
  id_proyecto: number,
  rol: string,
  id_usuario: number,
): Promise<void> {
  const proyecto = await proyectoRepository.findById(id_proyecto);
  if (!proyecto) throw new AppError('Proyecto no encontrado', 404);

  if (rol === 'Administrador' || rol === 'Coordinador') return;

  if (rol === 'Estudiante') {
    if (
      proyecto.id_estudiante_creador === id_usuario &&
      proyecto.estado_proyecto !== 'publicado'
    ) {
      return;
    }
    throw new AppError('Sin permiso para gestionar imágenes del proyecto', 403);
  }

  if (rol === 'Profesor') {
    const esCoord = await proyectoRepository.esCoordinador(id_proyecto, id_usuario);
    if (esCoord && proyecto.estado_proyecto !== 'publicado') return;
  }

  throw new AppError('Sin permiso para gestionar imágenes del proyecto', 403);
}

export const proyectoImagenService = {
  mapImagen,
  mapImagenes(
    imagenes: {
      id_imagen: number;
      id_proyecto: number;
      ruta_archivo: string;
      nombre_original: string;
      mime_type: string;
      orden: number;
    }[],
  ): ProyectoImagenDto[] {
    return imagenes.map(mapImagen);
  },

  async listar(id_proyecto: number) {
    const imagenes = await prisma.proyecto_imagenes.findMany({
      where: { id_proyecto, ...activo },
      orderBy: { orden: 'asc' },
    });
    return this.mapImagenes(imagenes);
  },

  async subir(
    id_proyecto: number,
    rol: string,
    id_usuario: number,
    files: Express.Multer.File[],
  ) {
    if (!files.length) {
      throw new AppError('Debe enviar al menos un archivo de imagen', 400);
    }

    await verificarPermisoImagenes(id_proyecto, rol, id_usuario);

    const existentes = await prisma.proyecto_imagenes.count({
      where: { id_proyecto, ...activo },
    });

    if (existentes + files.length > MAX_IMAGENES_POR_PROYECTO) {
      for (const file of files) {
        fs.unlink(file.path, () => undefined);
      }
      throw new AppError(
        `Máximo ${MAX_IMAGENES_POR_PROYECTO} imágenes por proyecto`,
        422,
      );
    }

    const creadas = await prisma.$transaction(async (tx) => {
      const registros = [];
      let orden = existentes + 1;

      for (const file of files) {
        const ruta = rutaPublicaProyecto(id_proyecto, path.basename(file.path));
        const imagen = await tx.proyecto_imagenes.create({
          data: {
            id_proyecto,
            ruta_archivo: ruta,
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

    await sincronizarUrlImagenPortada(id_proyecto);
    return this.mapImagenes(creadas);
  },

  async eliminar(id_proyecto: number, id_imagen: number, rol: string, id_usuario: number) {
    await verificarPermisoImagenes(id_proyecto, rol, id_usuario);

    const imagen = await prisma.proyecto_imagenes.findFirst({
      where: { id_imagen, id_proyecto, ...activo },
    });
    if (!imagen) throw new AppError('Imagen no encontrada', 404);

    await prisma.$transaction(async (tx) => {
      await tx.proyecto_imagenes.update({
        where: { id_imagen },
        data: { deleted_at: new Date() },
      });

      const restantes = await tx.proyecto_imagenes.findMany({
        where: { id_proyecto, ...activo },
        orderBy: { orden: 'asc' },
      });

      for (let i = 0; i < restantes.length; i += 1) {
        const img = restantes[i];
        if (img.orden !== i + 1) {
          await tx.proyecto_imagenes.update({
            where: { id_imagen: img.id_imagen },
            data: { orden: i + 1 },
          });
        }
      }
    });

    const rutaFisica = path.join(process.cwd(), imagen.ruta_archivo.replace(/^\//, ''));
    fs.unlink(rutaFisica, () => undefined);

    await sincronizarUrlImagenPortada(id_proyecto);
  },

  async contarActivas(id_proyecto: number): Promise<number> {
    return prisma.proyecto_imagenes.count({ where: { id_proyecto, ...activo } });
  },
};
