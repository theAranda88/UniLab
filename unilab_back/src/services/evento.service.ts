import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError';
import { eventoRepository } from '../models/evento.repository';

function parseDate(fecha: string): Date {
  return new Date(fecha);
}

function parseTime(hora: string): Date {
  return new Date(`1970-01-01T${hora}`);
}

export const eventoService = {
  listar() {
    return eventoRepository.findMany();
  },

  async obtener(id: number) {
    const evento = await eventoRepository.findById(id);
    if (!evento) throw new AppError('Evento no encontrado', 404);
    return evento;
  },

  async crear(data: {
    nombre_evento: string;
    tipo_evento: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    lugar: string;
    estado: string;
    requiere_pago?: boolean;
    id_organizador: number;
    created_by: number;
  }) {
    return eventoRepository.create({
      nombre_evento: data.nombre_evento,
      tipo_evento: data.tipo_evento,
      descripcion: data.descripcion,
      fecha_inicio: parseDate(data.fecha_inicio),
      fecha_fin: parseDate(data.fecha_fin),
      lugar: data.lugar,
      estado: data.estado,
      requiere_pago: data.requiere_pago ?? false,
      organizador: { connect: { id_usuario: data.id_organizador } },
      creador: { connect: { id_usuario: data.created_by } },
    });
  },

  async crearJornada(
    id_evento: number,
    data: { nombre_jornada: string; fecha: string; hora_inicio: string; hora_fin: string },
    created_by: number,
  ) {
    await eventoService.obtener(id_evento);
    return eventoRepository.crearJornada({
      nombre_jornada: data.nombre_jornada,
      fecha: parseDate(data.fecha),
      hora_inicio: parseTime(data.hora_inicio),
      hora_fin: parseTime(data.hora_fin),
      codigo_qr: randomUUID(),
      evento: { connect: { id_evento } },
      creador: { connect: { id_usuario: created_by } },
    });
  },

  async inscribir(id_evento: number, id_usuario: number, data: {
    tipo_asistente: string;
    nombre_completo: string;
    documento_identidad: string;
    email: string;
    telefono: string;
    institucion?: string;
    genero: string;
  }) {
    const evento = await eventoService.obtener(id_evento);

    const existente = await eventoRepository.findInscripcionEventoUsuario(id_evento, id_usuario);
    if (existente) throw new AppError('Ya está inscrito en este evento', 409);

    return eventoRepository.crearInscripcion({
      tipo_asistente: data.tipo_asistente,
      nombre_completo: data.nombre_completo,
      documento_identidad: data.documento_identidad,
      email: data.email,
      telefono: data.telefono,
      institucion: data.institucion,
      genero: data.genero,
      estado_pago: evento.requiere_pago ? 'pendiente' : null,
      evento: { connect: { id_evento } },
      usuario: { connect: { id_usuario } },
      creador: { connect: { id_usuario } },
    });
  },

  async actualizarPago(id_inscripcion: number, estado_pago: string) {
    const inscripcion = await eventoRepository.findInscripcionById(id_inscripcion);
    if (!inscripcion) throw new AppError('Inscripción no encontrada', 404);
    if (!inscripcion.evento.requiere_pago) {
      throw new AppError('Este evento no requiere pago', 422);
    }
    return eventoRepository.actualizarInscripcion(id_inscripcion, { estado_pago });
  },

  async registrarAsistencia(id_jornada: number, id_usuario: number, codigo_qr: string) {
    const jornada = await eventoRepository.findJornadaById(id_jornada);
    if (!jornada) throw new AppError('Jornada no encontrada', 404);
    if (jornada.codigo_qr !== codigo_qr) {
      throw new AppError('Código QR inválido', 422);
    }

    const inscripcion = await eventoRepository.findInscripcionEventoUsuario(
      jornada.id_evento,
      id_usuario,
    );
    if (!inscripcion) {
      throw new AppError('Debe estar inscrito en el evento', 422);
    }

    const yaRegistrada = await eventoRepository.buscarAsistencia(
      inscripcion.id_inscripcion,
      id_jornada,
    );
    if (yaRegistrada) throw new AppError('Asistencia ya registrada', 409);

    return eventoRepository.registrarAsistencia({
      inscripcion: { connect: { id_inscripcion: inscripcion.id_inscripcion } },
      jornada: { connect: { id_jornada } },
      fecha_hora_registro: new Date(),
      creador: { connect: { id_usuario } },
    });
  },

  async reportes(id_evento: number) {
    await eventoService.obtener(id_evento);
    const inscripciones = await eventoRepository.inscripcionesPorEvento(id_evento);
    const asistencias = await eventoRepository.reporteAsistentes(id_evento);

    const porJornada = asistencias.reduce<Record<number, typeof asistencias>>((acc, a) => {
      const key = a.id_jornada;
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});

    return {
      total_inscripciones: inscripciones.length,
      pagos_pendientes: inscripciones.filter((i) => i.estado_pago === 'pendiente'),
      pagos_confirmados: inscripciones.filter((i) => i.estado_pago === 'confirmado'),
      exentos: inscripciones.filter((i) => i.estado_pago === 'exento'),
      asistentes_por_jornada: porJornada,
    };
  },
};
