import type { Escuela } from './portal.model';

export type EstadoMembresia = 'pendiente' | 'aprobado' | 'rechazado';

export interface UsuarioBasico {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface SemilleroProfesor {
  id_semillero: number;
  id_profesor: number;
  es_lider: boolean;
  fecha_asignacion: string;
  profesor?: UsuarioBasico;
}

export interface SemilleroMiembro {
  id_membresia: number;
  id_semillero: number;
  id_estudiante: number;
  estado_solicitud: EstadoMembresia;
  puede_publicar: boolean;
  fecha_resolucion?: string | null;
  fecha_autorizacion?: string | null;
  created_at?: string;
  estudiante?: UsuarioBasico;
}

export interface Semillero {
  id_semillero: number;
  nombre_semillero: string;
  descripcion: string;
  id_escuela: number;
  id_profesor_lider: number;
  activo: boolean;
  escuela?: Escuela;
  profesor_lider?: UsuarioBasico;
  profesores: SemilleroProfesor[];
  miembros: SemilleroMiembro[];
}

export interface CrearSemilleroDto {
  nombre_semillero: string;
  descripcion: string;
  id_escuela: number;
  id_profesor_lider: number;
}

export type ActualizarSemilleroDto = Partial<CrearSemilleroDto & { activo: boolean }>;
