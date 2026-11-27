import { prisma } from './prisma.client';
import { activo } from './base.repository';
import type { Prisma } from '@prisma/client';

const organizadorSelect = {
  select: { id_usuario: true, nombres: true, apellidos: true, firma_ruta: true },
} as const;

/** Datos del evento que se imprimen en el certificado. */
const eventoCertificadoSelect = {
  select: {
    id_evento: true,
    nombre_evento: true,
    tipo_evento: true,
    fecha_inicio: true,
    fecha_fin: true,
    lugar: true,
    id_organizador: true,
    organizador: organizadorSelect,
  },
} as const;

const certificadoCompleto = {
  include: {
    inscripcion: {
      select: {
        id_inscripcion: true,
        id_usuario: true,
        email: true,
        evento: eventoCertificadoSelect,
      },
    },
  },
} as const;

export type CertificadoCompleto = Prisma.certificadosGetPayload<typeof certificadoCompleto>;

export const certificadoRepository = {
  findEvento(id_evento: number) {
    return prisma.eventos.findFirst({
      where: { id_evento, ...activo },
      select: {
        ...eventoCertificadoSelect.select,
        estado: true,
        requiere_pago: true,
        _count: { select: { jornadas: { where: activo } } },
      },
    });
  },

  /** Inscripciones con sus asistencias válidas y el certificado vigente, si lo hay. */
  inscripcionesConAsistencias(id_evento: number) {
    return prisma.inscripciones.findMany({
      where: { id_evento, ...activo },
      select: {
        id_inscripcion: true,
        id_usuario: true,
        nombre_completo: true,
        documento_identidad: true,
        email: true,
        tipo_asistente: true,
        estado_pago: true,
        asistencias: { where: { ...activo, jornada: activo }, select: { id_jornada: true } },
        certificados: {
          where: activo,
          select: { id_certificado: true, codigo_verificacion: true, fecha_emision: true },
        },
      },
      orderBy: { nombre_completo: 'asc' },
    });
  },

  crearMuchos(data: Prisma.certificadosCreateManyInput[]) {
    return prisma.certificados.createMany({ data, skipDuplicates: true });
  },

  findById(id_certificado: number) {
    return prisma.certificados.findFirst({ where: { id_certificado, ...activo }, ...certificadoCompleto });
  },

  findByCodigo(codigo_verificacion: string) {
    return prisma.certificados.findFirst({ where: { codigo_verificacion, ...activo }, ...certificadoCompleto });
  },

  findDelUsuario(id_usuario: number) {
    return prisma.certificados.findMany({
      where: { ...activo, inscripcion: { id_usuario, ...activo, evento: activo } },
      ...certificadoCompleto,
      orderBy: { fecha_emision: 'desc' },
    });
  },

  findPorEventoDocumento(id_evento: number, documento_identidad: string) {
    return prisma.certificados.findFirst({
      where: { ...activo, inscripcion: { id_evento, documento_identidad, ...activo } },
      ...certificadoCompleto,
    });
  },

  anular(id_certificado: number) {
    return prisma.certificados.update({ where: { id_certificado }, data: { deleted_at: new Date() } });
  },
};
