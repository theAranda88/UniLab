import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  CrearUsuarioResponse,
  EstudiantesProfesorResponse,
  Rol,
  RolNombre,
  UsuarioAdmin,
  UsuarioConsulta,
} from '../../core/models/usuario.model';
import { environment } from '../../../environments/environment';

export interface FiltroConsultaUsuarios {
  rol?: 'Profesor' | 'Estudiante';
  id_escuela?: number;
  busqueda?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  listar(filtroRol?: RolNombre): Observable<UsuarioAdmin[]> {
    const params = filtroRol ? { rol: filtroRol } : undefined;
    return this.http.get<UsuarioAdmin[]>(this.apiUrl, { params });
  }

  /** Listado de solo lectura (Coordinador y Profesor); el backend aplica el alcance según el rol. */
  consultar(filtro: FiltroConsultaUsuarios = {}): Observable<UsuarioConsulta[]> {
    const params: Record<string, string> = {};
    if (filtro.rol) params['rol'] = filtro.rol;
    if (filtro.id_escuela) params['id_escuela'] = String(filtro.id_escuela);
    if (filtro.busqueda) params['busqueda'] = filtro.busqueda;
    return this.http.get<UsuarioConsulta[]>(`${this.apiUrl}/consulta`, { params });
  }

  /** Estudiantes de los semilleros y proyectos del profesor autenticado. */
  estudiantesDeProfesor(): Observable<EstudiantesProfesorResponse> {
    return this.http.get<EstudiantesProfesorResponse>(`${environment.apiUrl}/profesores/me/estudiantes`);
  }

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  obtener(id: number): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(`${this.apiUrl}/${id}`);
  }

  crear(data: CrearUsuarioDto): Observable<CrearUsuarioResponse> {
    return this.http.post<CrearUsuarioResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: ActualizarUsuarioDto): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(`${this.apiUrl}/${id}`, data);
  }

  suspender(id: number): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(`${this.apiUrl}/${id}/suspender`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
