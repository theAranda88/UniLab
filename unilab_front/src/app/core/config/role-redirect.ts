import type { Router, UrlTree } from '@angular/router';

export interface PostLoginUser {
  id_rol: string;
  primer_login: boolean;
}

export function getDefaultRouteForRole(rol: string): string {
  switch (rol) {
    case 'Administrador':
      return '/admin/dashboard';
    case 'Coordinador':
      return '/coord/dashboard';
    case 'Profesor':
      return '/prof/dashboard';
    case 'Estudiante':
    case 'Externo':
      return '/';
    default:
      return '/login';
  }
}

export function getShellPrefix(rol: string): string | null {
  switch (rol) {
    case 'Administrador':
      return '/admin';
    case 'Coordinador':
      return '/coord';
    case 'Profesor':
      return '/prof';
    default:
      return null;
  }
}

export function isPortalStudentRole(rol: string): boolean {
  return rol === 'Estudiante' || rol === 'Externo';
}

/**
 * Resuelve la ruta post-login.
 * Retorna `null` cuando el usuario debe permanecer en la página actual (portal estudiante/externo).
 */
export function resolvePostLoginRoute(
  user: PostLoginUser,
  options?: { fromPortal?: boolean; returnUrl?: string | null },
): string | null {
  if (options?.returnUrl) {
    return options.returnUrl;
  }

  if (user.primer_login) {
    return '/cambiar-password';
  }

  if (options?.fromPortal && isPortalStudentRole(user.id_rol)) {
    return null;
  }

  return getDefaultRouteForRole(user.id_rol);
}

export function navigateAfterLogin(
  router: Router,
  user: PostLoginUser,
  options?: { fromPortal?: boolean; returnUrl?: string | null },
): Promise<boolean> {
  const target = resolvePostLoginRoute(user, options);
  if (!target) {
    return Promise.resolve(true);
  }
  return router.navigateByUrl(target);
}

export function createDefaultRouteTree(router: Router, rol: string): UrlTree {
  return router.parseUrl(getDefaultRouteForRole(rol));
}
