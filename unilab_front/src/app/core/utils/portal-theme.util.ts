import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { estiloEscuela, type Escuela, type EscuelaEstilo } from '../models/portal.model';

const PORTAL_STUDENT_ROLES = new Set(['Estudiante', 'Externo']);

function snapshotHasPortalTheme(snapshot: ActivatedRouteSnapshot | null): boolean {
  let current = snapshot;
  while (current) {
    if (current.data['portalTheme'] === true) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export function getActiveRouteSnapshot(router: Router): ActivatedRouteSnapshot {
  let route = router.routerState.root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.snapshot;
}

export function hasPortalTheme(route: ActivatedRoute): boolean {
  let current: ActivatedRoute | null = route;
  while (current) {
    if (current.snapshot.data['portalTheme'] === true) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/** Detecta si la UI debe usar el tema del portal público (ruta o rol estudiante/externo). */
export function shouldUsePortalUi(router: Router, role?: string | null): boolean {
  if (snapshotHasPortalTheme(getActiveRouteSnapshot(router))) {
    return true;
  }

  if (!role || !PORTAL_STUDENT_ROLES.has(role)) {
    return false;
  }

  const path = router.url.split('?')[0];
  if (path.startsWith('/admin') || path.startsWith('/coord') || path.startsWith('/prof')) {
    return false;
  }

  return (
    path === '/' ||
    path.startsWith('/eventos') ||
    path.startsWith('/mis-proyectos') ||
    path.startsWith('/escuelas') ||
    path.startsWith('/proyectos')
  );
}

/** Íconos Phosphor que se ofrecen al elegir el ícono de una escuela. */
export const ICONOS_ESCUELA: readonly string[] = [
  'ph-graduation-cap',
  'ph-code',
  'ph-gear-six',
  'ph-chart-line-up',
  'ph-chalkboard-teacher',
  'ph-scales',
  'ph-flask',
  'ph-atom',
  'ph-heartbeat',
  'ph-palette',
  'ph-music-notes',
  'ph-leaf',
  'ph-globe-hemisphere-west',
  'ph-buildings',
];

/** Colores sugeridos para la identidad de una escuela (el selector admite cualquier otro). */
export const COLORES_ESCUELA: readonly string[] = [
  '#053686',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#ea580c',
  '#b91c1c',
  '#db2777',
  '#7c3aed',
];

/**
 * Color e ícono con los que se pinta una escuela en el portal y en los paneles: los guardados
 * en la escuela y, si faltan, los deducidos de su nombre.
 */
export function estiloDeEscuela(
  escuela: Pick<Escuela, 'nombre_escuela' | 'color' | 'icono'> | null | undefined,
): EscuelaEstilo {
  const respaldo = estiloEscuela(escuela?.nombre_escuela ?? '');
  return {
    color: escuela?.color || respaldo.color,
    icono: escuela?.icono || respaldo.icono,
  };
}
