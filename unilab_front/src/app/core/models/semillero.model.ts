import type { Escuela } from './portal.model';

export type EstadoMembresia = 'pendiente' | 'aprobado' | 'rechazado';

/** Rol de un profesor dentro del semillero; «lider» va con es_lider = true. */
export type RolProfesorSemillero = 'lider' | 'coordinador' | 'acompanante';
/** Rol de un estudiante aprobado dentro del semillero. */
export type RolEstudianteSemillero = 'integrante' | 'lider' | 'coordinador';

export const ROLES_PROFESOR_EDITABLES: RolProfesorSemillero[] = ['coordinador', 'acompanante'];
export const ROLES_ESTUDIANTE: RolEstudianteSemillero[] = ['integrante', 'lider', 'coordinador'];

export interface UsuarioBasico {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  url_foto?: string | null;
}

export interface SemilleroProfesor {
  id_semillero: number;
  id_profesor: number;
  es_lider: boolean;
  rol: RolProfesorSemillero;
  fecha_asignacion: string;
  profesor?: UsuarioBasico;
}

export interface SemilleroMiembro {
  id_membresia: number;
  id_semillero: number;
  id_estudiante: number;
  estado_solicitud: EstadoMembresia;
  rol: RolEstudianteSemillero;
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
  url_foto_portada?: string | null;
  foto_portada_ruta?: string | null;
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

export interface SemilleroEvidencia {
  id_evidencia: number;
  id_semillero: number;
  ruta_archivo: string;
  url: string;
  nombre_original: string;
  mime_type: string;
  orden: number;
}
