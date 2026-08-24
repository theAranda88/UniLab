export interface AuthUser {
  id_usuario: number;
  id_rol: string;
  email: string;
  primer_login: boolean;
  perfil_pendiente: boolean;
}

export interface JwtPayload {
  id_usuario: number;
  id_rol: string;
  email: string;
}
