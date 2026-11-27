import path from 'path';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError';
import { certificadoRepository, type CertificadoCompleto } from '../models/certificado.repository';
import { configuracionService } from './configuracion.service';
import { generarCertificadoPdf } from './certificado-pdf';
import type { AuthUser } from '../middlewares/auth/types';

type EventoGestion = NonNullable<Awaited<ReturnType<typeof certificadoRepository.findEvento>>>;

/** Pagos que habilitan el certificado cuando el evento es pago. */
const PAGOS_VALIDOS = new Set(['confirmado', 'exento']);

/** El QR del diploma abre la página de verificación del portal. */
export function urlVerificacion(codigo: string): string {
  const base =
    process.env.FRONT_PUBLIC_URL ??
    process.env.CORS_ORIGINS?.split(',')[0]?.trim() ??
    'http://localhost:4200';
  return `${base.replace(/\/$/, '')}/certificados/verificar/${codigo}`;
}

export function porcentaje(asistidas: number, totales: number): number {
  return totales > 0 ? Math.floor((asistidas * 100) / totales) : 0;
}

function puedeGestionar(actor: AuthUser, evento: { id_organizador: number }): boolean {
  return actor.id_rol === 'Administrador' || actor.id_usuario === evento.id_organizador;
}

async function eventoGestionable(id_evento: number, actor: AuthUser): Promise<EventoGestion> {
  const evento = await certificadoRepository.findEvento(id_evento);
  if (!evento) throw new AppError('Evento no encontrado', 404);
  if (!puedeGestionar(actor, evento)) {
    throw new AppError('Solo el administrador o el organizador del evento gestionan sus certificados', 403);
  }
  return evento;
}

/** Oculta el documento en la verificación pública: solo deja ver los últimos 4 dígitos. */
function documentoOculto(documento: string): string {
  return documento.length <= 4 ? documento : `${'•'.repeat(documento.length - 4)}${documento.slice(-4)}`;
}

function resumen(c: CertificadoCompleto) {
  const e = c.inscripcion.evento;
  return {
    id_certificado: c.id_certificado,
    codigo_verificacion: c.codigo_verificacion,
    nombre_completo: c.nombre_completo,
    nombre_evento: c.nombre_evento,
    tipo_evento: e.tipo_evento,
    fecha_inicio: e.fecha_inicio,
    fecha_fin: e.fecha_fin,
    lugar: e.lugar,
    jornadas_asistidas: c.jornadas_asistidas,
    jornadas_totales: c.jornadas_totales,
    porcentaje_asistencia: c.porcentaje_asistencia,
    fecha_emision: c.fecha_emision,
    id_evento: e.id_evento,
  };
}

function pdf(c: CertificadoCompleto) {
  const e = c.inscripcion.evento;
  const firma = e.organizador.firma_ruta;
  return generarCertificadoPdf({
    ...resumen(c),
    documento_identidad: c.documento_identidad,
    organizador: `${e.organizador.nombres} ${e.organizador.apellidos}`,
    // Solo las firmas subidas a /uploads existen en disco
    firma_archivo: firma && !/^https?:\/\//i.test(firma) ? path.join(process.cwd(), firma.replace(/^\//, '')) : null,
    url_verificacion: urlVerificacion(c.codigo_verificacion),
  });
}

function nombreArchivo(c: CertificadoCompleto): string {
  const limpio = (t: string) =>
    t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `certificado-${limpio(c.nombre_evento)}-${limpio(c.nombre_completo)}.pdf`;
}

export const certificadoService = {
  /** Estado de cada inscrito frente al certificado: asistencia, si cumple y si ya lo tiene. */
  async resumenEvento(id_evento: number, actor: AuthUser) {
    const evento = await eventoGestionable(id_evento, actor);
    const minimo = await configuracionService.obtener('certificado_porcentaje_minimo');
    const totales = evento._count.jornadas;
    const inscripciones = await certificadoRepository.inscripcionesConAsistencias(id_evento);

    const inscritos = inscripciones.map((i) => {
      const asistidas = new Set(i.asistencias.map((a) => a.id_jornada)).size;
      const pct = porcentaje(asistidas, totales);
      const pago_ok = !evento.requiere_pago || PAGOS_VALIDOS.has(i.estado_pago ?? '');
      return {
        id_inscripcion: i.id_inscripcion,
        nombre_completo: i.nombre_completo,
        documento_identidad: i.documento_identidad,
        email: i.email,
        tipo_asistente: i.tipo_asistente,
        jornadas_asistidas: asistidas,
        porcentaje: pct,
        pago_ok,
        cumple: pago_ok && totales > 0 && pct >= minimo,
        certificado: i.certificados[0] ?? null,
      };
    });

    return {
      id_evento,
      nombre_evento: evento.nombre_evento,
      estado: evento.estado,
      jornadas_totales: totales,
      porcentaje_minimo: minimo,
      puede_emitir: evento.estado === 'finalizado' && totales > 0,
      inscritos,
    };
  },

  /** Emite los certificados que falten a quienes cumplen la asistencia mínima. */
  async emitir(id_evento: number, actor: AuthUser) {
    const estado = await certificadoService.resumenEvento(id_evento, actor);
    if (estado.estado !== 'finalizado') {
      throw new AppError('Los certificados se emiten cuando el evento está finalizado', 422);
    }
    if (estado.jornadas_totales === 0) {
      throw new AppError('El evento no tiene jornadas: no hay asistencia que certificar', 422);
    }

    const nuevos = estado.inscritos.filter((i) => i.cumple && !i.certificado);
    if (nuevos.length > 0) {
      await certificadoRepository.crearMuchos(
        nuevos.map((i) => ({
          id_inscripcion: i.id_inscripcion,
          codigo_verificacion: randomUUID(),
          nombre_completo: i.nombre_completo,
          documento_identidad: i.documento_identidad,
          nombre_evento: estado.nombre_evento,
          jornadas_asistidas: i.jornadas_asistidas,
          jornadas_totales: estado.jornadas_totales,
          porcentaje_asistencia: i.porcentaje,
          created_by: actor.id_usuario,
        })),
      );
    }

    return {
      emitidos: nuevos.length,
      ya_emitidos: estado.inscritos.filter((i) => i.certificado).length,
      no_cumplen: estado.inscritos.filter((i) => !i.cumple).length,
    };
  },

  async anular(id_certificado: number, actor: AuthUser) {
    const certificado = await certificadoRepository.findById(id_certificado);
    if (!certificado) throw new AppError('Certificado no encontrado', 404);
    if (!puedeGestionar(actor, certificado.inscripcion.evento)) {
      throw new AppError('Solo el administrador o el organizador del evento anulan certificados', 403);
    }
    await certificadoRepository.anular(id_certificado);
  },

  async misCertificados(id_usuario: number) {
    const certificados = await certificadoRepository.findDelUsuario(id_usuario);
    return certificados.map(resumen);
  },

  /** PDF para el titular, el organizador del evento o el administrador. */
  async pdfAutenticado(id_certificado: number, actor: AuthUser) {
    const certificado = await certificadoRepository.findById(id_certificado);
    if (!certificado) throw new AppError('Certificado no encontrado', 404);
    const esTitular = certificado.inscripcion.id_usuario === actor.id_usuario;
    if (!esTitular && !puedeGestionar(actor, certificado.inscripcion.evento)) {
      throw new AppError('No tiene acceso a este certificado', 403);
    }
    return { archivo: nombreArchivo(certificado), pdf: await pdf(certificado) };
  },

  /** Descarga sin cuenta: la cédula y el correo deben coincidir con los de la inscripción. */
  async pdfPublico(id_evento: number, documento_identidad: string, email: string) {
    const certificado = await certificadoRepository.findPorEventoDocumento(id_evento, documento_identidad.trim());
    if (!certificado || certificado.inscripcion.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      throw new AppError('No encontramos un certificado con esos datos para este evento', 404);
    }
    return { archivo: nombreArchivo(certificado), pdf: await pdf(certificado) };
  },

  async verificar(codigo_verificacion: string) {
    const certificado = await certificadoRepository.findByCodigo(codigo_verificacion);
    if (!certificado) throw new AppError('El código no corresponde a un certificado válido', 404);
    const e = certificado.inscripcion.evento;
    return {
      ...resumen(certificado),
      documento_identidad: documentoOculto(certificado.documento_identidad),
      organizador: `${e.organizador.nombres} ${e.organizador.apellidos}`,
    };
  },
};
