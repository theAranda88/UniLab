import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error';

        if (error.status === 401) {
          errorMessage = 'No autorizado. Por favor inicia sesión.';
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'No tienes permiso para acceder a este recurso.';
          this.router.navigate(['/unauthorized']);
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado.';
        } else if (error.status === 409) {
          errorMessage = error.error?.error || error.error?.message || 'Conflicto con el recurso.';
        } else if (error.status === 422) {
          errorMessage = error.error?.error || error.error?.message || 'Violación de regla de negocio.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          details: error.error,
        });

        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          details: error.error,
        }));
      })
    );
  }
}

// Versión standalone para Angular 15+
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error';

      if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor inicia sesión.';
        const authService = inject(AuthService);
        authService.logout();
        router.navigateByUrl('/', { replaceUrl: true });
      } else if (error.status === 403) {
        errorMessage = 'No tienes permiso para acceder a este recurso.';
        router.navigate(['/unauthorized']);
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 409) {
        errorMessage = error.error?.error || error.error?.message || 'Conflicto con el recurso.';
      } else if (error.status === 422) {
        errorMessage = error.error?.error || error.error?.message || 'Violación de regla de negocio.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        details: error.error,
      });

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        details: error.error,
      }));
    })
  );
};
