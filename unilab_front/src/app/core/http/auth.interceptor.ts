import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Interceptor que agrega el token JWT al header Authorization de todas las solicitudes
 * en formato: Authorization: Bearer <token>
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService['tokenSubject']?.value; // Acceder al token actual

  if (token) {
    // Clonar la solicitud y agregar el header Authorization
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
