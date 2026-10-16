import { prisma } from './prisma.client';
import { activo } from './base.repository';

/** Consultas agregadas para el reporte global de la plataforma (RA-012). */
export const reporteRepository = {
  async datosResumen() {
    const [
      roles,
      usuariosPorRol,
      usuariosInactivos,
      escuelas,
      cursos,
      proyectosPorCursoEstado,
      semilleros,
      miembrosPorEstado,
      eventosPorEstado,
      inscripciones,
      asistencias,
    ] = await Promise.all([
      prisma.roles.findMany({ where: activo, select: { id_rol: true, nombre_rol: true } }),
      prisma.usuarios.groupBy({ by: ['id_rol'], where: activo, _count: { _all: true } }),
      prisma.usuarios.count({ where: { ...activo, activo: false } }),
      prisma.escuelas.findMany({
        where: activo,
        select: { id_escuela: true, nombre_escuela: true },
        orderBy: { nombre_escuela: 'asc' },
      }),
      prisma.cursos.findMany({ where: activo, select: { id_curso: true, id_escuela: true } }),
      prisma.proyectos.groupBy({
        by: ['id_curso', 'estado_proyecto'],
        where: activo,
        _count: { _all: true },
      }),
      prisma.semilleros.findMany({ where: activo, select: { activo: true } }),
      prisma.semillero_miembros.groupBy({
        by: ['estado_solicitud'],
        where: { ...activo, semillero: activo },
        _count: { _all: true },
      }),
      prisma.eventos.groupBy({ by: ['estado'], where: activo, _count: { _all: true } }),
      prisma.inscripciones.count({ where: { ...activo, evento: activo } }),
      prisma.asistencias.count({ where: activo }),
    ]);

    return {
      roles,
      usuariosPorRol: usuariosPorRol.map((u) => ({ id_rol: u.id_rol, total: u._count._all })),
      usuariosInactivos,
      escuelas,
      cursos,
      proyectosPorCursoEstado: proyectosPorCursoEstado.map((p) => ({
        id_curso: p.id_curso,
        estado: p.estado_proyecto,
        total: p._count._all,
      })),
      semilleros,
      miembrosPorEstado: miembrosPorEstado.map((m) => ({
        estado: m.estado_solicitud,
        total: m._count._all,
      })),
      eventosPorEstado: eventosPorEstado.map((e) => ({ estado: e.estado, total: e._count._all })),
      inscripciones,
      asistencias,
    };
  },
};

export type DatosResumen = Awaited<ReturnType<typeof reporteRepository.datosResumen>>;
