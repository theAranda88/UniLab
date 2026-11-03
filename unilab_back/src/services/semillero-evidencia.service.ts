import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { semilleroRepository } from '../models/semillero.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';
import {
  MAX_EVIDENCIAS_POR_SEMILLERO,
  rutaPublicaSemilleroEvidencia,
  urlPublicaImagen,
} from '../utils/uploadPaths';

export interface SemilleroEvidenciaDto {
  id_evidencia: number;
  id_semillero: number;
  ruta_archivo: string;
  url: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

function mapEvidencia(evidencia: {
  id_evidencia: number;
  id_semillero: number;
  ruta_archivo: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}): SemilleroEvidenciaDto {
  return {
    ...evidencia,
    url: urlPublicaImagen(evidencia.ruta_archivo),
  };
}

export const semilleroEvidenciaService = {
  mapEvidencias(
    evidencias: {
      id_evidencia: number;
      id_semillero: number;
      ruta_archivo: string;
      nombre_original: string;
      mime_type: string;
      orden: number;
    }[],
  ): SemilleroEvidenciaDto[] {
    return evidencias.map(mapEvidencia);
  },

  async listar(id_semillero: number) {
    const semillero = await semilleroRepository.findById(id_semillero);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);

    const evidencias = await prisma.semillero_evidencias.findMany({
      where: { id_semillero, ...activo },
      orderBy: { orden: 'asc' },
    });
    return this.mapEvidencias(evidencias);
  },

  async subir(id_semillero: number, id_usuario: number, files: Express.Multer.File[]) {
    if (!files.length) {
      throw new AppError('Debe enviar al menos una evidencia', 400);
    }

    const semillero = await semilleroRepository.findById(id_semillero);
    if (!semillero) throw new AppError('Semillero no encontrado', 404);

    const existentes = await prisma.semillero_evidencias.count({
      where: { id_semillero, ...activo },
    });

    if (existentes + files.length > MAX_EVIDENCIAS_POR_SEMILLERO) {
      for (const file of files) {
        fs.unlink(file.path, () => undefined);
      }
      throw new AppError(
        `Máximo ${MAX_EVIDENCIAS_POR_SEMILLERO} evidencias por semillero`,
        422,
      );
    }

    await prisma.$transaction(async (tx) => {
      let orden = existentes + 1;

      for (const file of files) {
        const ruta = rutaPublicaSemilleroEvidencia(id_semillero, path.basename(file.path));
        await tx.semillero_evidencias.create({
          data: {
            id_semillero,
            ruta_archivo: ruta,
            nombre_original: file.originalname,
            mime_type: file.mimetype,
            orden,
            created_by: id_usuario,
          },
        });
        orden += 1;
      }
    });

    const todas = await prisma.semillero_evidencias.findMany({
      where: { id_semillero, ...activo },
      orderBy: { orden: 'asc' },
    });
    return this.mapEvidencias(todas);
  },

  async eliminar(id_semillero: number, id_evidencia: number) {
    const evidencia = await prisma.semillero_evidencias.findFirst({
      where: { id_evidencia, id_semillero, ...activo },
    });
    if (!evidencia) throw new AppError('Evidencia no encontrada', 404);

    await prisma.$transaction(async (tx) => {
      await tx.semillero_evidencias.update({
        where: { id_evidencia },
        data: { deleted_at: new Date() },
      });

      const restantes = await tx.semillero_evidencias.findMany({
        where: { id_semillero, ...activo },
        orderBy: { orden: 'asc' },
      });

      for (let i = 0; i < restantes.length; i += 1) {
        const ev = restantes[i];
        if (ev.orden !== i + 1) {
          await tx.semillero_evidencias.update({
            where: { id_evidencia: ev.id_evidencia },
            data: { orden: i + 1 },
          });
        }
      }
    });

    const rutaFisica = path.join(process.cwd(), evidencia.ruta_archivo.replace(/^\//, ''));
    fs.unlink(rutaFisica, () => undefined);
  },
};
