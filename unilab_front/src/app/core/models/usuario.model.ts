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
