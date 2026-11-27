import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

/** Datos de usuario expuestos en semilleros: nunca incluir password_hash ni google_sub. */
const usuarioResumen = {
  select: { id_usuario: true, nombres: true, apellidos: true, email: true, foto_ruta: true },
} as const;

/** Persona en el equipo público del semillero (sin correo). */
const personaPublica = {
  select: { id_usuario: true, nombres: true, apellidos: true, titular: true, foto_ruta: true },
} as const;

export interface FiltroSemillerosPublicos {
  id_escuela?: number;
  /** Texto libre sobre nombre o descripción del semillero. */
  busqueda?: string;
}

/** Proyectos que cuentan en el portal: publicados y sin borrar. */
const proyectosPublicados = { ...activo, estado_proyecto: 'publicado' };

function whereSemillerosPublicos(filtro: FiltroSemillerosPublicos): Prisma.semillerosWhereInput {
  const contiene = filtro.busqueda ? { contains: filtro.busqueda, mode: 'insensitive' as const } : null;
  return {
    ...activo,
    activo: true,
    ...(filtro.id_escuela !== undefined ? { id_escuela: filtro.id_escuela } : {}),
    ...(contiene ? { OR: [{ nombre_semillero: contiene }, { descripcion: contiene }] } : {}),
  };
}

export const semilleroRepository = {
  findMany(filtro?: { ids_escuela?: number[] }) {
    return prisma.semilleros.findMany({
      where: { ...activo, ...(filtro?.ids_escuela ? { id_escuela: { in: filtro.ids_escuela } } : {}) },
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

  actualizarProfesor(id_semillero: number, id_profesor: number, data: Prisma.semillero_profesoresUpdateInput) {
    return prisma.semillero_profesores.update({
      where: { id_semillero_id_profesor: { id_semillero, id_profesor } },
      data,
    });
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

  /** Semilleros visibles en el portal agrupados por escuela. */
  async countPublicosPorEscuela(): Promise<Record<number, number>> {
    const filas = await prisma.semilleros.groupBy({
      by: ['id_escuela'],
      where: whereSemillerosPublicos({}),
      _count: { _all: true },
    });
    return Object.fromEntries(filas.map((f) => [f.id_escuela, f._count._all]));
  },

  countPublicos(filtro: FiltroSemillerosPublicos = {}) {
    return prisma.semilleros.count({ where: whereSemillerosPublicos(filtro) });
  },

  findManyPublicos(params: FiltroSemillerosPublicos & { skip: number; take: number }) {
    const miembrosAprobados = { ...activo, estado_solicitud: 'aprobado' as const };
    return prisma.semilleros.findMany({
      where: whereSemillerosPublicos(params),
      include: {
        escuela: { select: { id_escuela: true, nombre_escuela: true, color: true, icono: true } },
        profesor_lider: { select: { nombres: true, apellidos: true } },
        evidencias: {
          where: activo,
          orderBy: { orden: 'asc' },
          take: 1,
          select: { ruta_archivo: true },
        },
        _count: {
          select: { miembros: { where: miembrosAprobados }, proyectos: { where: proyectosPublicados } },
        },
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
        profesores: {
          where: { ...activo, profesor: activo },
          select: { rol: true, profesor: personaPublica },
        },
        miembros: {
          where: { ...miembrosAprobados, estudiante: activo },
          select: { rol: true, estudiante: personaPublica },
        },
        _count: {
          select: { miembros: { where: miembrosAprobados }, proyectos: { where: proyectosPublicados } },
        },
      },
    });
  },
};
