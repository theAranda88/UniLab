import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

/** Autor del comentario: solo el nombre (es información pública en el portal). */
const autorComentario = { usuario: { select: { nombres: true, apellidos: true } } } as const;

export const proyectoRepository = {
  findMany(where?: Prisma.proyectosWhereInput) {
    return prisma.proyectos.findMany({
      where: { ...activo, ...where },
      include: {
        curso: { include: { escuela: true } },
        semillero: true,
        estudiante_creador: { include: { rol: true } },
        coordinadores: { where: activo, include: { profesor: true } },
        autores: { where: activo, include: { estudiante: true } },
        imagenes: { where: activo, orderBy: { orden: 'asc' } },
      },
      orderBy: { id_proyecto: 'desc' },
    });
  },

  findById(id: number) {
    return prisma.proyectos.findFirst({
      where: { id_proyecto: id, ...activo },
      include: {
        curso: { include: { escuela: true } },
        semillero: true,
        estudiante_creador: { include: { rol: true } },
        coordinadores: { where: activo, include: { profesor: true } },
        autores: { where: activo, include: { estudiante: true } },
        comentarios: { where: activo, include: autorComentario },
        calificaciones: { where: activo },
        imagenes: { where: activo, orderBy: { orden: 'asc' } },
      },
    });
  },

  create(data: Prisma.proyectosCreateInput) {
    return prisma.proyectos.create({ data });
  },

  update(id: number, data: Prisma.proyectosUpdateInput) {
    return prisma.proyectos.update({ where: { id_proyecto: id }, data });
  },

  softDelete(id: number) {
    return prisma.proyectos.update({
      where: { id_proyecto: id },
      data: { deleted_at: new Date() },
    });
  },

  esCoordinador(id_proyecto: number, id_profesor: number) {
    return prisma.proyecto_coordinadores.findFirst({
      where: { id_proyecto, id_profesor, ...activo },
    });
  },

  registrarVista(id_proyecto: number, id_usuario: number | null) {
    return prisma.$transaction([
      prisma.proyecto_vistas.create({
        data: {
          id_proyecto,
          id_usuario: id_usuario ?? undefined,
          fecha_hora_visita: new Date(),
        },
      }),
      prisma.proyectos.update({
        where: { id_proyecto },
        data: { contador_vistas: { increment: 1 } },
      }),
    ]);
  },

  crearComentario(data: Prisma.comentariosCreateInput) {
    return prisma.comentarios.create({ data, include: autorComentario });
  },

  findComentarioById(id_comentario: number) {
    return prisma.comentarios.findFirst({ where: { id_comentario, ...activo } });
  },

  /** Borrado lógico del comentario y de sus respuestas (no quedan respuestas huérfanas). */
  softDeleteComentario(id_comentario: number) {
    const ahora = new Date();
    return prisma.$transaction([
      prisma.comentarios.updateMany({
        where: { id_comentario_padre: id_comentario, ...activo },
        data: { deleted_at: ahora },
      }),
      prisma.comentarios.update({
        where: { id_comentario },
        data: { deleted_at: ahora },
      }),
    ]);
  },

  upsertCalificacion(id_proyecto: number, id_usuario: number, puntuacion: number) {
    return prisma.calificaciones.upsert({
      where: {
        id_proyecto_id_usuario: { id_proyecto, id_usuario },
      },
      create: {
        id_proyecto,
        id_usuario,
        puntuacion,
      },
      update: { puntuacion, deleted_at: null },
    });
  },

  agregarCoordinador(id_proyecto: number, id_profesor: number, created_by?: number) {
    return prisma.proyecto_coordinadores.create({
      data: { id_proyecto, id_profesor, created_by },
    });
  },

  async countPublicadosPorEscuela(): Promise<Record<number, number>> {
    const proyectos = await prisma.proyectos.findMany({
      where: { ...activo, estado_proyecto: 'publicado' },
      select: { curso: { select: { id_escuela: true } } },
    });

    const conteos: Record<number, number> = {};
    for (const proyecto of proyectos) {
      const idEscuela = proyecto.curso.id_escuela;
      conteos[idEscuela] = (conteos[idEscuela] ?? 0) + 1;
    }
    return conteos;
  },
};
