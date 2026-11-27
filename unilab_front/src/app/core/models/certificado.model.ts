/** Certificado de asistencia tal como lo ve su titular o la página de verificación. */
export interface Certificado {
  id_certificado: number;
  codigo_verificacion: string;
  nombre_completo: string;
  nombre_evento: string;
  tipo_evento: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  jornadas_asistidas: number;
  jornadas_totales: number;
  porcentaje_asistencia: number;
  fecha_emision: string;
  id_evento: number;
}

export interface CertificadoVerificado extends Certificado {
  /** Parcialmente oculto: solo los últimos 4 dígitos. */
  documento_identidad: string;
  organizador: string;
}

export interface InscritoCertificado {
  id_inscripcion: number;
  nombre_completo: string;
  documento_identidad: string;
  email: string;
  tipo_asistente: string;
  jornadas_asistidas: number;
  porcentaje: number;
  pago_ok: boolean;
  cumple: boolean;
  certificado: { id_certificado: number; codigo_verificacion: string; fecha_emision: string } | null;
}

export interface CertificadosEvento {
  id_evento: number;
  nombre_evento: string;
  estado: string;
  jornadas_totales: number;
  porcentaje_minimo: number;
  puede_emitir: boolean;
  inscritos: InscritoCertificado[];
}

export interface ResultadoEmision {
  emitidos: number;
  ya_emitidos: number;
  no_cumplen: number;
}
