import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

export const eventoRepository = {
  findMany() {
    return prisma.eventos.findMany({
      where: activo,
      include: { jornadas: { where: activo }, organizador: true },
      orderBy: { id_evento: 'desc' },
    });
  },

  findById(id: number) {
    return prisma.eventos.findFirst({
      where: { id_evento: id, ...activo },
      include: {
        jornadas: { where: activo },
        organizador: true,
        inscripciones: { where: activo },
      },
    });
  },

  create(data: Prisma.eventosCreateInput) {
    return prisma.eventos.create({ data });
  },

  crearJornada(data: Prisma.evento_jornadasCreateInput) {
    return prisma.evento_jornadas.create({ data });
  },

  findJornadaById(id: number) {
    return prisma.evento_jornadas.findFirst({
      where: { id_jornada: id, ...activo },
      include: { evento: true },
    });
  },

  findJornadaByQr(codigo_qr: string) {
    return prisma.evento_jornadas.findFirst({
      where: { codigo_qr, ...activo },
      include: { evento: true },
    });
  },

  findJornadasByEventoId(id_evento: number) {
    return prisma.evento_jornadas.findMany({
      where: { id_evento, ...activo },
      orderBy: { fecha: 'asc' },
    });
  },

  crearInscripcion(data: Prisma.inscripcionesCreateInput) {
    return prisma.inscripciones.create({ data });
  },

  findInscripcionById(id: number) {
    return prisma.inscripciones.findFirst({
      where: { id_inscripcion: id, ...activo },
      include: { evento: true },
    });
  },

  findInscripcionEventoUsuario(id_evento: number, id_usuario: number) {
    return prisma.inscripciones.findFirst({
      where: { id_evento, id_usuario, ...activo },
    });
  },

  actualizarInscripcion(id: number, data: Prisma.inscripcionesUpdateInput) {
    return prisma.inscripciones.update({ where: { id_inscripcion: id }, data });
  },

  registrarAsistencia(data: Prisma.asistenciasCreateInput) {
    return prisma.asistencias.create({ data });
  },

  buscarAsistencia(id_inscripcion: number, id_jornada: number) {
    return prisma.asistencias.findFirst({
      where: { id_inscripcion, id_jornada, ...activo },
    });
  },

  reporteAsistentes(id_evento: number) {
    return prisma.asistencias.findMany({
      where: {
        ...activo,
        inscripcion: { id_evento, ...activo },
      },
      include: {
        jornada: true,
        inscripcion: { include: { usuario: true } },
      },
    });
  },

  inscripcionesPorEvento(id_evento: number) {
    return prisma.inscripciones.findMany({
      where: { id_evento, ...activo },
      include: { usuario: true },
    });
  },
};
