// Evento
/** `solicitado` y `rechazado` solo aplican a eventos externos pendientes de aprobación. */
export type EstadoEvento = 'planeado' | 'activo' | 'finalizado' | 'solicitado' | 'rechazado';

/** A quién pertenece el evento. */
export type AlcanceEvento = 'institucional' | 'escuela' | 'semillero' | 'externo';

export interface Evento {
  id_evento: number;
  nombre_evento: string;
  tipo_evento: string;
  descripcion: string;
  fecha_inicio: string; // ISO 8601
  fecha_fin: string;
  lugar: string;
  id_organizador: number;
  estado: EstadoEvento;
  requiere_pago: boolean;
  alcance: AlcanceEvento;
  id_escuela: number | null;
  id_semillero: number | null;
  organizacion_externa: string | null;
  motivo_rechazo: string | null;
  escuela?: { id_escuela: number; nombre_escuela: string } | null;
  semillero?: { id_semillero: number; nombre_semillero: string } | null;
  url_flyer?: string | null;
  flyer_ruta_archivo?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JornadaEvidencia {
  id_evidencia: number;
  id_jornada: number;
  ruta_archivo: string;
  url: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}

// Jornada
export interface EventoJornada {
  id_jornada: number;
  id_evento: number;
  nombre_jornada: string;
  fecha: string; // ISO 8601
  hora_inicio: string; // ISO 8601 (time format)
  hora_fin: string;
  codigo_qr: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Inscripción
export interface InscripcionUsuario {
  id_usuario: number;
  email: string;
  nombres: string;
  apellidos: string;
  rol: { nombre_rol: string };
}

export interface Inscripcion {
  id_inscripcion: number;
  id_evento: number;
  id_usuario: number | null;
  tipo_asistente: 'externo' | 'estudiante' | 'profesor';
  nombre_completo: string;
  documento_identidad: string;
  email: string;
  telefono: string;
  institucion?: string;
  genero: string;
  estado_pago?: 'pendiente' | 'confirmado' | 'exento' | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  usuario?: InscripcionUsuario;
}

// Asistencia
export interface Asistencia {
  id_asistencia: number;
  id_inscripcion: number;
  id_jornada: number;
  fecha_hora_registro: string; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// DTOs para creación/actualización
export interface CreateEventoDto {
  nombre_evento: string;
  tipo_evento: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  estado: 'planeado' | 'activo' | 'finalizado';
  requiere_pago?: boolean;
  alcance?: AlcanceEvento;
  id_escuela?: number | null;
  id_semillero?: number | null;
  organizacion_externa?: string | null;
}

/** Solicitud de evento externo (rol Externo). */
export interface SolicitudEventoDto {
  nombre_evento: string;
  tipo_evento: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  requiere_pago?: boolean;
  organizacion_externa: string;
}

export interface ResolverSolicitudEventoDto {
  decision: 'aprobar' | 'rechazar';
  motivo_rechazo?: string;
}

export interface UpdateEventoDto {
  nombre_evento?: string;
  tipo_evento?: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  lugar?: string;
  estado?: 'planeado' | 'activo' | 'finalizado';
  requiere_pago?: boolean;
  alcance?: AlcanceEvento;
  id_escuela?: number | null;
  id_semillero?: number | null;
  organizacion_externa?: string | null;
}

export interface CreateJornadaDto {
  nombre_jornada: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface MiInscripcionResponse {
  inscrito: boolean;
  inscripcion: Inscripcion | null;
}

export interface CreateInscripcionDto {
  tipo_asistente: 'externo' | 'estudiante' | 'profesor';
  nombre_completo: string;
  documento_identidad: string;
  email: string;
  telefono: string;
  institucion?: string;
  genero: string;
}

export interface RegistrarAsistenciaDto {
  codigo_qr: string;
}

export interface RegistrarAsistenciaPublicaDto {
  codigo_qr: string;
  documento_identidad: string;
}

// Reporte
export interface ReporteEventoRow {
  id_inscripcion: number;
  nombre_completo: string;
  documento_identidad: string;
  email: string;
  genero: string;
  tipo_asistente: string;
  estado_pago?: string;
  asistencias: { [jornadaId: number]: boolean };
  total_asistencias: number;
}

export interface ReporteEvento {
  id_evento: number;
  nombre_evento: string;
  fecha_inicio: string;
  fecha_fin: string;
  jornadas: EventoJornada[];
  inscritos: ReporteEventoRow[];
}
