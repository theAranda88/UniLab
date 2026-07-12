import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

export const escuelaRepository = {
  findMany() {
    return prisma.escuelas.findMany({
      where: activo,
      include: { cursos: { where: activo } },
      orderBy: { id_escuela: 'asc' },
    });
  },

  findById(id: number) {
    return prisma.escuelas.findFirst({
      where: { id_escuela: id, ...activo },
      include: { cursos: { where: activo } },
    });
  },

  create(data: Prisma.escuelasCreateInput) {
    return prisma.escuelas.create({ data });
  },

  update(id: number, data: Prisma.escuelasUpdateInput) {
    return prisma.escuelas.update({ where: { id_escuela: id }, data });
  },

  softDelete(id: number) {
    return prisma.escuelas.update({
      where: { id_escuela: id },
      data: { deleted_at: new Date() },
    });
  },
};

export const cursoRepository = {
  findMany(filtro?: { id_escuela?: number }) {
    return prisma.cursos.findMany({
      where: { ...activo, ...(filtro?.id_escuela ? { id_escuela: filtro.id_escuela } : {}) },
      include: { escuela: true },
      orderBy: { id_curso: 'asc' },
    });
  },

  findById(id: number) {
    return prisma.cursos.findFirst({
      where: { id_curso: id, ...activo },
      include: { escuela: true },
    });
  },

  create(data: Prisma.cursosCreateInput) {
    return prisma.cursos.create({ data, include: { escuela: true } });
  },

  update(id: number, data: Prisma.cursosUpdateInput) {
    return prisma.cursos.update({
      where: { id_curso: id },
      data,
      include: { escuela: true },
    });
  },

  softDelete(id: number) {
    return prisma.cursos.update({
      where: { id_curso: id },
      data: { deleted_at: new Date() },
    });
  },

  crearAutorizacion(data: Prisma.curso_autorizacionesCreateInput) {
    return prisma.curso_autorizaciones.create({ data });
  },

  buscarAutorizacionVigente(id_curso: number, id_estudiante: number) {
    return prisma.curso_autorizaciones.findFirst({
      where: {
        id_curso,
        id_estudiante,
        autorizado: true,
        ...activo,
      },
    });
  },
};
