import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import type { ConfiguracionSistema } from '../../core/models/configuracion.model';
import { environment } from '../../../environments/environment';

/** Valores usados si la API pública no responde: el portal sigue funcionando como hasta ahora. */
const CONFIGURACION_FALLBACK: ConfiguracionSistema = {
  registro_abierto: true,
  semilleros_solicitudes_abiertas: true,
  mensaje_portal: '',
};

/** RA-013 · Parámetros del sistema editables sin despliegue. */
@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private publica$?: Observable<ConfiguracionSistema>;

  /** Lectura pública (sin sesión), cacheada durante la visita. */
  publica(): Observable<ConfiguracionSistema> {
    this.publica$ ??= this.http
      .get<ConfiguracionSistema>(`${this.apiUrl}/public/configuracion`)
      .pipe(
        catchError(() => of(CONFIGURACION_FALLBACK)),
        shareReplay(1),
      );
    return this.publica$;
  }

  obtener(): Observable<ConfiguracionSistema> {
    return this.http.get<ConfiguracionSistema>(`${this.apiUrl}/configuracion`);
  }

  actualizar(cambios: Partial<ConfiguracionSistema>): Observable<ConfiguracionSistema> {
    this.publica$ = undefined;
    return this.http.patch<ConfiguracionSistema>(`${this.apiUrl}/configuracion`, cambios);
  }
}
