import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import ExcelJS from 'exceljs';
import { AppError } from '../utils/AppError';
import { eventoRepository } from '../models/evento.repository';
import { prisma } from '../models/prisma.client';

function parseDate(fecha: string): Date {
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(fecha);
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  return new Date(year, month, day);
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  async actualizar(
    id: number,
    data: {
      nombre_evento?: string;
      tipo_evento?: string;
      descripcion?: string;
      fecha_inicio?: string;
      fecha_fin?: string;
      lugar?: string;
      estado?: string;
      requiere_pago?: boolean;
    },
  ) {
    await eventoService.obtener(id);
    return eventoRepository.update(id, {
      nombre_evento: data.nombre_evento,
      tipo_evento: data.tipo_evento,
      descripcion: data.descripcion,
      fecha_inicio: data.fecha_inicio ? parseDate(data.fecha_inicio) : undefined,
      fecha_fin: data.fecha_fin ? parseDate(data.fecha_fin) : undefined,
      lugar: data.lugar,
      estado: data.estado,
      requiere_pago: data.requiere_pago,
    });
  },

  async eliminar(id: number) {
    await eventoService.obtener(id);
    const ahora = new Date();
    await prisma.$transaction([
      eventoRepository.softDeleteJornadasPorEvento(id, ahora),
      eventoRepository.softDeleteInscripcionesPorEvento(id, ahora),
      prisma.eventos.update({
        where: { id_evento: id },
        data: { deleted_at: ahora },
      }),
    ]);
  },

  async listarInscripciones(id_evento: number) {
    await eventoService.obtener(id_evento);
    return eventoRepository.inscripcionesPorEvento(id_evento);
  },

  async obtenerMiInscripcion(id_evento: number, id_usuario: number) {
    await eventoService.obtener(id_evento);
    const inscripcion = await eventoRepository.findInscripcionEventoUsuario(id_evento, id_usuario);
    return { inscrito: !!inscripcion, inscripcion };
  },

  async crearJornada(
    id_evento: number,
    data: { nombre_jornada: string; fecha: string; hora_inicio: string; hora_fin: string },
    created_by: number,
  ) {
    const evento = await eventoService.obtener(id_evento);
    const fechaJornada = data.fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0];
    if (!fechaJornada) throw new AppError('Fecha de jornada inválida', 400);

    const inicio = toDateKey(evento.fecha_inicio);
    const fin = toDateKey(evento.fecha_fin);
    if (fechaJornada < inicio || fechaJornada > fin) {
      throw new AppError(
        'La fecha de la jornada debe estar dentro del rango del evento',
        422,
      );
    }

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

  async registrarAsistencia(codigo_qr: string, id_usuario: number) {
    const jornada = await eventoRepository.findJornadaByQr(codigo_qr);
    if (!jornada) throw new AppError('Código QR inválido', 422);

    const inscripcion = await eventoRepository.findInscripcionEventoUsuario(
      jornada.id_evento,
      id_usuario,
    );
    if (!inscripcion) {
      throw new AppError('Debe estar inscrito en el evento', 422);
    }

    const evento = await eventoService.obtener(jornada.id_evento);
    if (evento.requiere_pago && inscripcion.estado_pago !== 'confirmado') {
      throw new AppError(
        'El pago de la inscripción debe estar confirmado para registrar asistencia',
        422,
      );
    }

    const yaRegistrada = await eventoRepository.buscarAsistencia(
      inscripcion.id_inscripcion,
      jornada.id_jornada,
    );
    if (yaRegistrada) throw new AppError('Asistencia ya registrada', 409);

    return eventoRepository.registrarAsistencia({
      inscripcion: { connect: { id_inscripcion: inscripcion.id_inscripcion } },
      jornada: { connect: { id_jornada: jornada.id_jornada } },
      fecha_hora_registro: new Date(),
      creador: { connect: { id_usuario } },
    });
  },

  async reportes(id_evento: number) {
    const evento = await eventoService.obtener(id_evento);
    const jornadas = await eventoRepository.findJornadasByEventoId(id_evento);
    const inscripciones = await eventoRepository.inscripcionesPorEvento(id_evento);
    const asistencias = await eventoRepository.reporteAsistentes(id_evento);

    // Contar asistencias por inscripción
    const asistenciasPorInscripcion = asistencias.reduce<
      Record<number, number>
    >((acc, a) => {
      if (!acc[a.id_inscripcion]) acc[a.id_inscripcion] = 0;
      acc[a.id_inscripcion]++;
      return acc;
    }, {});

    const inscritos = inscripciones.map((i) => ({
      id_inscripcion: i.id_inscripcion,
      nombre_completo: i.nombre_completo,
      documento_identidad: i.documento_identidad,
      email: i.email,
      tipo_asistente: i.tipo_asistente,
      estado_pago: i.estado_pago,
      total_asistencias: asistenciasPorInscripcion[i.id_inscripcion] || 0,
    }));

    return {
      id_evento,
      nombre_evento: evento.nombre_evento,
      fecha_inicio: evento.fecha_inicio.toISOString(),
      fecha_fin: evento.fecha_fin.toISOString(),
      jornadas,
      inscritos,
    };
  },

  async obtenerJornadas(id_evento: number, id_usuario: number, rol: string) {
    const evento = await eventoService.obtener(id_evento);
    const rolesStaff = ['Administrador', 'Coordinador'];

    if (!rolesStaff.includes(rol)) {
      const inscripcion = await eventoRepository.findInscripcionEventoUsuario(
        id_evento,
        id_usuario,
      );
      if (!inscripcion) {
        throw new AppError('Debe estar inscrito en el evento para ver las jornadas', 403);
      }
      if (evento.requiere_pago && inscripcion.estado_pago !== 'confirmado') {
        throw new AppError(
          'El pago de la inscripción debe estar confirmado para ver las jornadas',
          403,
        );
      }
    }

    return eventoRepository.findJornadasByEventoId(id_evento);
  },

  async exportarCSV(id_evento: number) {
    const reporte = await eventoService.reportes(id_evento);
    let csv = 'Nombre,Documento,Email,Tipo Asistente,Estado Pago,Total Asistencias\n';
    
    reporte.inscritos.forEach((inscrito) => {
      const row = [
        `"${inscrito.nombre_completo}"`,
        `"${inscrito.documento_identidad}"`,
        `"${inscrito.email}"`,
        inscrito.tipo_asistente,
        inscrito.estado_pago || 'N/A',
        inscrito.total_asistencias,
      ].join(',');
      csv += row + '\n';
    });

    return csv;
  },

  async exportarExcel(id_evento: number) {
    const reporte = await eventoService.reportes(id_evento);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Evento');

    // Encabezados
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre_completo', width: 20 },
      { header: 'Documento', key: 'documento_identidad', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Tipo Asistente', key: 'tipo_asistente', width: 15 },
      { header: 'Estado Pago', key: 'estado_pago', width: 15 },
      { header: 'Asistencias', key: 'total_asistencias', width: 12 },
    ];

    // Estilos al encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF243B8E' },
    };

    // Agregar datos
    worksheet.addRows(reporte.inscritos);

    // Buffer
    return workbook.xlsx.writeBuffer();
  },

  async generarQR(codigo_qr: string, formato: 'svg' | 'png' = 'svg'): Promise<string | Buffer> {
    try {
      if (formato === 'svg') {
        return await QRCode.toString(codigo_qr, { type: 'svg', width: 200 });
      } else {
        return await QRCode.toBuffer(codigo_qr, { width: 200, type: 'png' });
      }
    } catch (error) {
      throw new AppError('Error generando QR', 500);
    }
  },
};
