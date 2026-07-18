import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';

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

/** Detecta si la UI debe usar el tema portal Codex (ruta o rol estudiante/externo). */
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
    path.startsWith('/escuelas') ||
    path.startsWith('/proyectos')
  );
}
