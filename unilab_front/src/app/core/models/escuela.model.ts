export interface EscuelaAdmin {
  id_escuela: number;
  nombre_escuela: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrearEscuelaDto {
  nombre_escuela: string;
}

export interface ActualizarEscuelaDto {
  nombre_escuela: string;
}
