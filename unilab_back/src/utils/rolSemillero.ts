/**
 * Rol que se muestra de una persona en un semillero. Profesores: líder, coordinador o acompañante;
 * estudiantes: estudiante (integrante), líder estudiantil o coordinador estudiantil.
 */
export type RolSemilleroVisible =
  | 'lider'
  | 'coordinador'
  | 'acompanante'
  | 'lider_estudiantil'
  | 'coordinador_estudiantil'
  | 'estudiante';

/** De mayor a menor: si alguien aparece dos veces en un semillero, se queda el primero. */
const PRIORIDAD: RolSemilleroVisible[] = [
  'lider',
  'coordinador',
  'acompanante',
  'lider_estudiantil',
  'coordinador_estudiantil',
  'estudiante',
];

export function rolVisibleProfesor(p: { es_lider: boolean; rol?: string | null }): RolSemilleroVisible {
  if (p.es_lider || p.rol === 'lider') return 'lider';
  return p.rol === 'coordinador' ? 'coordinador' : 'acompanante';
}

export function rolVisibleEstudiante(rol?: string | null): RolSemilleroVisible {
  if (rol === 'lider') return 'lider_estudiantil';
  if (rol === 'coordinador') return 'coordinador_estudiantil';
  return 'estudiante';
}

type SemilleroBase = { id_semillero: number; nombre_semillero: string };

/** Une los semilleros de una persona sin duplicados, con su rol más alto, ordenados por nombre. */
export function unirSemillerosConRol<S extends SemilleroBase>(entradas: { semillero: S; rol: RolSemilleroVisible }[]) {
  const porId = new Map<number, { semillero: S; rol: RolSemilleroVisible }>();
  for (const e of entradas) {
    const previo = porId.get(e.semillero.id_semillero);
    if (!previo || PRIORIDAD.indexOf(e.rol) < PRIORIDAD.indexOf(previo.rol)) porId.set(e.semillero.id_semillero, e);
  }
  return [...porId.values()].sort((a, b) => a.semillero.nombre_semillero.localeCompare(b.semillero.nombre_semillero));
}
