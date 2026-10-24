export interface EscuelaImagen {
  id_imagen: number;
  id_escuela: number;
  url: string;
  orden: number;
  nombre_original?: string;
  mime_type?: string;
}

/** Profesor encargado de la escuela (solo datos públicos). */
export interface EscuelaEncargado {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

export interface EscuelaAdmin {
  id_escuela: number;
  nombre_escuela: string;
  descripcion: string | null;
  /** Color de identidad en formato #RRGGBB. */
  color: string | null;
  /** Clase de ícono Phosphor (p. ej. `ph-code`). */
  icono: string | null;
  id_encargado: number | null;
  encargado: EscuelaEncargado | null;
  imagenes: EscuelaImagen[];
  created_at?: string;
  updated_at?: string;
}

export interface CrearEscuelaDto {
  nombre_escuela: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  id_encargado?: number | null;
}

export type ActualizarEscuelaDto = Partial<CrearEscuelaDto>;
