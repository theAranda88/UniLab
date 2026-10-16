import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ActualizarSemilleroDto,
  CrearSemilleroDto,
  EstadoMembresia,
  Semillero,
  SemilleroMiembro,
} from '../../core/models/semillero.model';
import { AuthService } from '../../core/auth/auth.service';
import { getShellPrefix } from '../../core/config/role-redirect';

/** RF-015 / RA-010 · Semilleros: CRUD (admin), membresía (estudiante) y resolución (profesor líder). */
@Injectable({ providedIn: 'root' })
export class SemillerosService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/semilleros';

  /** Ruta base del listado en el panel del rol actual (p. ej. /admin/semilleros). */
  getBasePath(): string {
    return `${getShellPrefix(this.auth.getCurrentUser()?.id_rol ?? '') ?? '/admin'}/semilleros`;
  }

  listar(): Observable<Semillero[]> {
    return this.http.get<Semillero[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Semillero> {
    return this.http.get<Semillero>(`${this.apiUrl}/${id}`);
  }

  crear(data: CrearSemilleroDto): Observable<Semillero> {
    return this.http.post<Semillero>(this.apiUrl, data);
  }

  actualizar(id: number, data: ActualizarSemilleroDto): Observable<Semillero> {
    return this.http.patch<Semillero>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  asignarProfesor(id: number, idProfesor: number): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${id}/profesores`, { id_profesor: idProfesor });
  }

  quitarProfesor(id: number, idProfesor: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/profesores/${idProfesor}`);
  }

  solicitarIngreso(id: number): Observable<SemilleroMiembro> {
    return this.http.post<SemilleroMiembro>(`${this.apiUrl}/${id}/miembros`, {});
  }

  resolverSolicitud(
    id: number,
    idEstudiante: number,
    estado: Exclude<EstadoMembresia, 'pendiente'>,
  ): Observable<SemilleroMiembro> {
    return this.http.patch<SemilleroMiembro>(`${this.apiUrl}/${id}/miembros/${idEstudiante}`, {
      estado_solicitud: estado,
    });
  }

  autorizarPublicacion(id: number, idEstudiante: number): Observable<SemilleroMiembro> {
    return this.http.patch<SemilleroMiembro>(
      `${this.apiUrl}/${id}/miembros/${idEstudiante}/autorizar-publicacion`,
      {},
    );
  }
}
