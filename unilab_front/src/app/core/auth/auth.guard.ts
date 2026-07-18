import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';
import { createDefaultRouteTree } from '../config/role-redirect';

/**
 * Guardia de autenticación.
 * Verifica si el usuario está autenticado antes de permitir el acceso a una ruta.
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Guardia de rol.
 * Verifica si el usuario tiene los roles requeridos.
 * Uso: data: { roles: ['Administrador', 'Coordinador'] }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guardia de primer login.
 * Redirige a cambiar contraseña si es el primer login.
 */
export const primerLoginGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (user.primer_login) {
    router.navigate(['/cambiar-password']);
    return false;
  }

  return true;
};

/**
 * Redirige a la ruta por defecto según el rol del usuario autenticado.
 */
export const roleRedirectGuard: CanActivateFn = (): UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/login']);
  }
  return createDefaultRouteTree(router, user.id_rol);
};
