import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { eventoRepository } from '../models/evento.repository';
import { prisma } from '../models/prisma.client';
import { activo } from '../models/base.repository';
import {
  MAX_EVIDENCIAS_POR_JORNADA,
  rutaPublicaJornadaEvidencia,
  urlPublicaImagen,
} from '../utils/uploadPaths';

const ROLES_STAFF = new Set(['Administrador', 'Coordinador']);

export interface JornadaEvidenciaDto {
  id_evidencia: number;
  id_jornada: number;
  ruta_archivo: string;
  url: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

function verificarStaff(rol: string): void {
  if (!ROLES_STAFF.has(rol)) {
    throw new AppError('Sin permiso para gestionar evidencias de jornada', 403);
  }
}

function mapEvidencia(evidencia: {
  id_evidencia: number;
  id_jornada: number;
  ruta_archivo: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}): JornadaEvidenciaDto {
  return {
    ...evidencia,
    url: urlPublicaImagen(evidencia.ruta_archivo),
  };
}

export const eventoJornadaEvidenciaService = {
  mapEvidencias(
    evidencias: {
      id_evidencia: number;
      id_jornada: number;
      ruta_archivo: string;
      nombre_original: string;
      mime_type: string;
      orden: number;
    }[],
  ): JornadaEvidenciaDto[] {
    return evidencias.map(mapEvidencia);
  },

  async listar(id_jornada: number, rol: string) {
    verificarStaff(rol);
    const jornada = await eventoRepository.findJornadaById(id_jornada);
    if (!jornada) throw new AppError('Jornada no encontrada', 404);

    const evidencias = await prisma.evento_jornada_evidencias.findMany({
      where: { id_jornada, ...activo },
      orderBy: { orden: 'asc' },
    });
    return this.mapEvidencias(evidencias);
  },

  async subir(
    id_jornada: number,
    rol: string,
    id_usuario: number,
    files: Express.Multer.File[],
  ) {
    verificarStaff(rol);
    if (!files.length) {
      throw new AppError('Debe enviar al menos una evidencia', 400);
    }

    const jornada = await eventoRepository.findJornadaById(id_jornada);
    if (!jornada) throw new AppError('Jornada no encontrada', 404);

    const existentes = await prisma.evento_jornada_evidencias.count({
      where: { id_jornada, ...activo },
    });

    if (existentes + files.length > MAX_EVIDENCIAS_POR_JORNADA) {
      for (const file of files) {
        fs.unlink(file.path, () => undefined);
      }
      throw new AppError(
        `Máximo ${MAX_EVIDENCIAS_POR_JORNADA} evidencias por jornada`,
        422,
      );
    }

    await prisma.$transaction(async (tx) => {
      const registros = [];
      let orden = existentes + 1;

      for (const file of files) {
        const ruta = rutaPublicaJornadaEvidencia(id_jornada, path.basename(file.path));
        const evidencia = await tx.evento_jornada_evidencias.create({
          data: {
            id_jornada,
            ruta_archivo: ruta,
            nombre_original: file.originalname,
            mime_type: file.mimetype,
            orden,
            created_by: id_usuario,
          },
        });
        registros.push(evidencia);
        orden += 1;
      }

      return registros;
    });

    const todas = await prisma.evento_jornada_evidencias.findMany({
      where: { id_jornada, ...activo },
      orderBy: { orden: 'asc' },
    });
    return this.mapEvidencias(todas);
  },

  async eliminar(id_jornada: number, id_evidencia: number, rol: string) {
    verificarStaff(rol);

    const evidencia = await prisma.evento_jornada_evidencias.findFirst({
      where: { id_evidencia, id_jornada, ...activo },
    });
    if (!evidencia) throw new AppError('Evidencia no encontrada', 404);

    await prisma.$transaction(async (tx) => {
      await tx.evento_jornada_evidencias.update({
        where: { id_evidencia },
        data: { deleted_at: new Date() },
      });

      const restantes = await tx.evento_jornada_evidencias.findMany({
        where: { id_jornada, ...activo },
        orderBy: { orden: 'asc' },
      });

      for (let i = 0; i < restantes.length; i += 1) {
        const ev = restantes[i];
        if (ev.orden !== i + 1) {
          await tx.evento_jornada_evidencias.update({
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
