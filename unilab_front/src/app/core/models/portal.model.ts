export interface EscuelaImagenPublica {
  id_imagen: number;
  url: string;
  orden: number;
}

export interface Escuela {
  id_escuela: number;
  nombre_escuela: string;
  descripcion?: string | null;
  /** Color de identidad guardado (#RRGGBB); si falta se deduce del nombre. */
  color?: string | null;
  /** Ícono Phosphor guardado; si falta se deduce del nombre. */
  icono?: string | null;
  imagenes?: EscuelaImagenPublica[];
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
  id_profesor_lider?: number;
}

export interface SemilleroEvidenciaPublica {
  id_evidencia: number;
  url: string;
  orden: number;
  nombre_original?: string;
}

export interface SemilleroPublico {
  id_semillero: number;
  nombre_semillero: string;
  descripcion: string;
  url_foto_portada?: string | null;
  escuela: {
    id_escuela: number;
    nombre_escuela: string;
    color?: string | null;
    icono?: string | null;
  };
  lider: UsuarioResumen;
  total_miembros_aprobados: number;
  evidencias?: SemilleroEvidenciaPublica[];
}

export interface SemillerosPublicosPaginados {
  data: SemilleroPublico[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
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
  /** Filas del detalle público, con el nombre del autor. */
  comentarios?: ComentarioProyecto[];
  calificaciones?: CalificacionProyecto[];
}

export interface ComentarioProyecto {
  id_comentario: number;
  id_proyecto: number;
  id_usuario: number;
  id_comentario_padre: number | null;
  contenido: string;
  fecha_comentario: string;
  /** Autor: el detalle público solo expone su nombre. */
  usuario?: UsuarioResumen;
}

export interface CalificacionProyecto {
  id_calificacion: number;
  id_proyecto: number;
  id_usuario: number;
  /** 1 a 5 */
  puntuacion: number;
}

export function urlsImagenesProyecto(proyecto: Pick<ProyectoPublico, 'imagenes' | 'url_imagen'>): string[] {
  if (proyecto.imagenes?.length) {
    return [...proyecto.imagenes]
      .sort((a, b) => a.orden - b.orden)
      .map((img) => img.url || resolverUrlImagen((img as { ruta_archivo?: string }).ruta_archivo))
      .filter(Boolean);
  }
  return proyecto.url_imagen ? [proyecto.url_imagen] : [];
}

import { environment } from '../../../environments/environment';

function resolverUrlImagen(ruta?: string | null): string {
  if (!ruta) return '';
  if (ruta.startsWith('http')) return ruta;
  const origin = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
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

/** Minúsculas y sin tildes: «Ingenieria» o «INGENIERÍA» coinciden con «Ingeniería». */
function normalizarNombre(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function resolveEscuelaCardConfig(nombreEscuela: string): EscuelaCardConfig | null {
  const nombre = normalizarNombre(nombreEscuela ?? '');
  return ESCUELA_CARD_CONFIGS.find((c) => nombre.includes(normalizarNombre(c.nameMatch))) ?? null;
}

export interface EscuelaEstilo {
  /** Clase de ícono Phosphor duotone (p. ej. `ph-scales`). */
  icono: string;
  /** Color de identidad de la escuela. */
  color: string;
}

/** Ícono y color por escuela; `generic` es el respaldo para escuelas nuevas sin estilo propio. */
const ESCUELA_ESTILOS: Record<EscuelaThemeKey | 'generic', EscuelaEstilo> = {
  software: { icono: 'ph-code', color: '#2563eb' },
  ingenieria: { icono: 'ph-gear-six', color: '#ea580c' },
  negocios: { icono: 'ph-chart-line-up', color: '#059669' },
  educacion: { icono: 'ph-chalkboard-teacher', color: '#7c3aed' },
  derecho: { icono: 'ph-scales', color: '#b91c1c' },
  generic: { icono: 'ph-graduation-cap', color: '#053686' },
};

/**
 * Estilo visual deducido del nombre de la escuela (respaldo cuando no tiene color o ícono
 * guardados; ver `estiloDeEscuela` en `portal-theme.util.ts`). Se deduce del
 * nombre; cualquier escuela que no coincida (p. ej. una recién creada) recibe el estilo
 * institucional genérico, siempre el mismo para que no cambie entre visitas.
 */
export function estiloEscuela(nombreEscuela: string): EscuelaEstilo {
  return ESCUELA_ESTILOS[resolveEscuelaCardConfig(nombreEscuela)?.themeKey ?? 'generic'];
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
