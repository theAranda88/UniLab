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
  institucion?: string;
  ocupacion?: string;
}

export interface CrearUsuarioResponse {
  usuario: UsuarioAdmin;
  password_temporal: string;
}

export interface CompletarPerfilDto {
  documento_identidad: string;
  telefono: string;
  codigo_estudiantil?: string;
  id_escuela?: number;
  institucion?: string;
  ocupacion?: string;
}
