import type { ProyectoPublico } from './portal.model';

export type RolNombre =
  | 'Administrador'
  | 'Coordinador'
  | 'Profesor'
  | 'Estudiante'
  | 'Externo';

export interface Rol {
  id_rol: number;
  nombre_rol: RolNombre;
  descripcion?: string | null;
}

export interface UsuarioAdmin {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string;
  activo: boolean;
  primer_login: boolean;
  perfil_pendiente: boolean;
  rol: Rol;
  created_at?: string;
  perfil_coordinador?: { cargo: string; dependencia: string; profesion: string | null } | null;
}

export interface CrearUsuarioDto {
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string;
  rol: RolNombre;
  codigo_docente?: string;
  codigo_estudiantil?: string;
  id_escuela?: number;
  cargo?: string;
  dependencia?: string;
  profesion?: string;
  institucion?: string;
  ocupacion?: string;
}

export interface ActualizarUsuarioDto {
  nombres?: string;
  apellidos?: string;
  email?: string;
  documento_identidad?: string;
  telefono?: string;
  rol?: RolNombre;
  codigo_docente?: string;
  codigo_estudiantil?: string;
  id_escuela?: number;
  cargo?: string;
  dependencia?: string;
  profesion?: string;
  institucion?: string;
  ocupacion?: string;
}

export interface CrearUsuarioResponse {
  usuario: UsuarioAdmin;
  password_temporal: string;
}

export interface CompletarPerfilDto extends ActualizarRedesDto {
  documento_identidad: string;
  telefono: string;
  codigo_estudiantil?: string;
  id_escuela?: number;
  institucion?: string;
  ocupacion?: string;
}

/** Redes de contacto tal como las devuelve el backend. */
export interface RedesContacto {
  linkedin: string | null;
  github: string | null;
  portafolio: string | null;
  /** Redes académicas del perfil tipo CvLAC (pueden no venir en respuestas antiguas). */
  cvlac?: string | null;
  orcid?: string | null;
  google_scholar?: string | null;
  researchgate?: string | null;
}

/** Redes de contacto editables: cadena vacía o null borran el valor. */
export interface ActualizarRedesDto {
  url_linkedin?: string | null;
  url_github?: string | null;
  url_portafolio?: string | null;
}

/** Cuerpo de PATCH /auth/me. `profesion` solo aplica al Coordinador. */
export interface ActualizarMiPerfilDto extends ActualizarRedesDto {
  telefono?: string;
  profesion?: string | null;
  url_cvlac?: string | null;
  url_orcid?: string | null;
  url_google_scholar?: string | null;
  url_researchgate?: string | null;
  titular?: string | null;
  biografia?: string | null;
  especialidades?: string[];
  fortalezas?: string[];
  mostrar_telefono?: boolean;
}

/** Datos profesionales que el usuario escribe en su perfil (tipo CvLAC). */
export interface PerfilCv {
  titular: string | null;
  biografia: string | null;
  especialidades: string[];
  fortalezas: string[];
  mostrar_telefono: boolean;
}

export type NivelFormacion =
  | 'tecnico'
  | 'tecnologo'
  | 'pregrado'
  | 'especializacion'
  | 'maestria'
  | 'doctorado'
  | 'curso'
  | 'otro';

export interface FormacionAcademica {
  id_formacion: number;
  titulo: string;
  institucion: string;
  nivel: NivelFormacion;
  anio_inicio: number | null;
  /** null = en curso */
  anio_fin: number | null;
}

export type FormacionDto = Omit<FormacionAcademica, 'id_formacion'>;

/** Perfil público (GET /public/usuarios/:id/perfil): sin correo ni documento. */
export interface PerfilPublico {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  rol: RolNombre;
  titular: string | null;
  biografia: string | null;
  especialidades: string[];
  fortalezas: string[];
  telefono: string | null;
  escuelas: EscuelaResumen[];
  cargo: string | null;
  dependencia: string | null;
  profesion: string | null;
  institucion: string | null;
  ocupacion: string | null;
  redes: RedesContacto;
  formacion: FormacionAcademica[];
  semilleros: { id_semillero: number; nombre_semillero: string; rol: RolSemillero }[];
  proyectos: (ProyectoPublico & { participacion: 'autor' | 'director' })[];
  eventos: {
    id_evento: number;
    nombre_evento: string;
    tipo_evento: string;
    fecha_inicio: string;
    fecha_fin: string;
    lugar: string;
    total_jornadas: number;
    jornadas_asistidas: number;
  }[];
}

export interface CambiarMiPasswordDto {
  password_actual: string;
  nueva_password: string;
}

export interface EscuelaResumen {
  id_escuela: number;
  nombre_escuela: string;
}

export type RolSemillero = 'lider' | 'profesor' | 'miembro';

export interface SemilleroUsuario {
  id_semillero: number;
  nombre_semillero: string;
  rol_semillero: RolSemillero;
}

/** Datos del perfil según el rol; los que no aplican llegan en null. */
export interface PerfilRol {
  codigo_docente: string | null;
  codigo_estudiantil: string | null;
  cargo: string | null;
  dependencia: string | null;
  profesion: string | null;
  institucion: string | null;
  ocupacion: string | null;
}

/** Fila de los listados de solo lectura (GET /usuarios/consulta). */
export interface UsuarioConsulta {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  activo: boolean;
  rol: 'Profesor' | 'Estudiante';
  codigo: string | null;
  escuela: EscuelaResumen | null;
  redes: RedesContacto;
}

export interface VinculoSemillero {
  id_semillero: number;
  nombre_semillero: string;
}

export interface VinculoProyecto {
  id_proyecto: number;
  titulo: string;
  estado_proyecto: string;
}

export interface EstudianteProfesor extends UsuarioConsulta {
  semilleros: VinculoSemillero[];
  proyectos: VinculoProyecto[];
}

/** GET /profesores/me/estudiantes */
export interface EstudiantesProfesorResponse {
  estudiantes: EstudianteProfesor[];
  semilleros: VinculoSemillero[];
  proyectos: VinculoProyecto[];
}
