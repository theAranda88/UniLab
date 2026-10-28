import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

/** Datos de usuario expuestos en semilleros: nunca incluir password_hash ni google_sub. */
const usuarioResumen = {
  select: { id_usuario: true, nombres: true, apellidos: true, email: true },
} as const;

export const semilleroRepository = {
  findMany() {
    return prisma.semilleros.findMany({
      where: activo,
      include: {
        escuela: true,
        profesor_lider: usuarioResumen,
        profesores: { where: activo, include: { profesor: usuarioResumen } },
        miembros: { where: activo },
      },
      orderBy: { id_semillero: 'asc' },
    });
  },

  findById(id: number) {
    return prisma.semilleros.findFirst({
      where: { id_semillero: id, ...activo },
      include: {
        escuela: true,
        profesor_lider: usuarioResumen,
        profesores: { where: activo, include: { profesor: usuarioResumen } },
        miembros: {
          where: activo,
          include: { estudiante: usuarioResumen },
          orderBy: { created_at: 'desc' },
        },
      },
    });
  },

  create(data: Prisma.semillerosCreateInput) {
    return prisma.semilleros.create({ data });
  },

  update(id: number, data: Prisma.semillerosUpdateInput) {
    return prisma.semilleros.update({ where: { id_semillero: id }, data });
  },

  softDelete(id: number) {
    return prisma.semilleros.update({
      where: { id_semillero: id },
      data: { deleted_at: new Date() },
    });
  },

  agregarProfesor(data: Prisma.semillero_profesoresCreateInput) {
    return prisma.semillero_profesores.create({ data });
  },

  buscarProfesor(id_semillero: number, id_profesor: number) {
    return prisma.semillero_profesores.findFirst({
      where: { id_semillero, id_profesor, ...activo },
    });
  },

  quitarProfesor(id_semillero: number, id_profesor: number) {
    return prisma.semillero_profesores.updateMany({
      where: { id_semillero, id_profesor, ...activo },
      data: { deleted_at: new Date() },
    });
  },

  buscarMembresia(id_semillero: number, id_estudiante: number) {
    return prisma.semillero_miembros.findFirst({
      where: { id_semillero, id_estudiante, ...activo },
    });
  },

  crearMembresia(data: Prisma.semillero_miembrosCreateInput) {
    return prisma.semillero_miembros.create({ data });
  },

  actualizarMembresia(id_membresia: number, data: Prisma.semillero_miembrosUpdateInput) {
    return prisma.semillero_miembros.update({
      where: { id_membresia },
      data,
    });
  },

  membresiaConPublicacion(id_semillero: number, id_estudiante: number) {
    return prisma.semillero_miembros.findFirst({
      where: {
        id_semillero,
        id_estudiante,
        puede_publicar: true,
        estado_solicitud: 'aprobado',
        ...activo,
      },
    });
  },

  countPublicos(id_escuela?: number) {
    return prisma.semilleros.count({
      where: {
        ...activo,
        activo: true,
        ...(id_escuela !== undefined ? { id_escuela } : {}),
      },
    });
  },

  findManyPublicos(params: { id_escuela?: number; skip: number; take: number }) {
    const miembrosAprobados = { ...activo, estado_solicitud: 'aprobado' as const };
    return prisma.semilleros.findMany({
      where: {
        ...activo,
        activo: true,
        ...(params.id_escuela !== undefined ? { id_escuela: params.id_escuela } : {}),
      },
      include: {
        escuela: { select: { id_escuela: true, nombre_escuela: true } },
        profesor_lider: { select: { nombres: true, apellidos: true } },
        _count: { select: { miembros: { where: miembrosAprobados } } },
      },
      orderBy: { nombre_semillero: 'asc' },
      skip: params.skip,
      take: params.take,
    });
  },

  findPublicoById(id: number) {
    const miembrosAprobados = { ...activo, estado_solicitud: 'aprobado' as const };
    return prisma.semilleros.findFirst({
      where: { id_semillero: id, ...activo, activo: true },
      include: {
        escuela: { select: { id_escuela: true, nombre_escuela: true, color: true, icono: true } },
        profesor_lider: { select: { nombres: true, apellidos: true } },
        evidencias: { where: activo, orderBy: { orden: 'asc' } },
        _count: { select: { miembros: { where: miembrosAprobados } } },
      },
    });
  },
};
