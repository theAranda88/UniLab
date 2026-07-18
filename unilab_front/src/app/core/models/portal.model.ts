export interface Escuela {
  id_escuela: number;
  nombre_escuela: string;
  total_proyectos_publicados?: number;
}

export interface Curso {
  id_curso: number;
  id_escuela: number;
  nombre_curso: string;
  periodo_academico: string;
  escuela?: Escuela;
}

export interface UsuarioResumen {
  nombres: string;
  apellidos: string;
}

export interface SemilleroResumen {
  id_semillero: number;
  nombre_semillero: string;
  descripcion?: string;
}

export interface ProyectoAutor {
  rol_autor: string | null;
  estudiante: UsuarioResumen;
}

export interface ProyectoImagen {
  id_imagen: number;
  url: string;
  orden: number;
  nombre_original?: string;
  mime_type?: string;
}

export interface ProyectoPublico {
  id_proyecto: number;
  titulo: string;
  descripcion: string;
  tipo_proyecto: string;
  url_aplicativo: string;
  url_imagen: string | null;
  imagenes?: ProyectoImagen[];
  url_apk: string | null;
  url_youtube: string | null;
  url_spotify: string | null;
  estado_proyecto: string;
  contador_vistas: number;
  fecha_publicacion?: string | null;
  curso?: Curso & { escuela?: Escuela };
  semillero?: SemilleroResumen | null;
  estudiante_creador?: UsuarioResumen;
  coordinadores?: { profesor: UsuarioResumen }[];
  autores?: ProyectoAutor[];
}

export function urlsImagenesProyecto(proyecto: Pick<ProyectoPublico, 'imagenes' | 'url_imagen'>): string[] {
  if (proyecto.imagenes?.length) {
    return [...proyecto.imagenes]
      .sort((a, b) => a.orden - b.orden)
      .map((img) => img.url);
  }
  return proyecto.url_imagen ? [proyecto.url_imagen] : [];
}

export type EscuelaThemeKey =
  | 'derecho'
  | 'educacion'
  | 'ingenieria'
  | 'negocios'
  | 'software';

export interface EscuelaCardConfig {
  themeKey: EscuelaThemeKey;
  nameMatch: string;
}

export const ESCUELA_CARD_CONFIGS: EscuelaCardConfig[] = [
  { themeKey: 'software', nameMatch: 'Software' },
  { themeKey: 'derecho', nameMatch: 'Derecho' },
  { themeKey: 'ingenieria', nameMatch: 'Ingeniería' },
  { themeKey: 'educacion', nameMatch: 'Educación' },
  { themeKey: 'negocios', nameMatch: 'Negocios' },
];

export interface EscuelaCardViewModel {
  escuela: Escuela;
  /** Clave i18n para tema conocido; `generic` si no hay match en ESCUELA_CARD_CONFIGS */
  i18nKey: EscuelaThemeKey | 'generic';
  /** Si true, el título se muestra desde `nombre_escuela` del API */
  useApiName: boolean;
  emergeDelay: number;
}

export function resolveEscuelaCardConfig(nombreEscuela: string): EscuelaCardConfig | null {
  return ESCUELA_CARD_CONFIGS.find((c) => nombreEscuela.includes(c.nameMatch)) ?? null;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  email: string;
  documento_identidad: string;
  telefono: string;
  rol: 'Estudiante' | 'Externo';
  codigo_estudiantil?: string;
  id_escuela?: number;
  institucion?: string;
  ocupacion?: string;
}

export interface RegisterResponse {
  usuario: { id_usuario: number; email: string };
  password_temporal: string;
  mensaje: string;
}
