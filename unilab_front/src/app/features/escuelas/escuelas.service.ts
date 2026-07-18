import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ActualizarEscuelaDto, CrearEscuelaDto, EscuelaAdmin } from '../../core/models/escuela.model';
import { AuthService } from '../../core/auth/auth.service';
import { getEscuelasBasePath } from '../../core/config/escuelas-paths';

@Injectable({ providedIn: 'root' })
export class EscuelasService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/escuelas';

  getBasePath(): string {
    return getEscuelasBasePath(this.auth.getCurrentUser()?.id_rol);
  }

  puedeGestionar(): boolean {
    return this.auth.hasAnyRole(['Administrador', 'Coordinador']);
  }

  listar(): Observable<EscuelaAdmin[]> {
    return this.http.get<EscuelaAdmin[]>(this.apiUrl);
  }

  obtener(id: number): Observable<EscuelaAdmin> {
    return this.http.get<EscuelaAdmin>(`${this.apiUrl}/${id}`);
  }

  crear(data: CrearEscuelaDto): Observable<EscuelaAdmin> {
    return this.http.post<EscuelaAdmin>(this.apiUrl, data);
  }

  actualizar(id: number, data: ActualizarEscuelaDto): Observable<EscuelaAdmin> {
    return this.http.patch<EscuelaAdmin>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
