import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  CrearUsuarioResponse,
  Rol,
  RolNombre,
  UsuarioAdmin,
} from '../../core/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/usuarios';

  listar(filtroRol?: RolNombre): Observable<UsuarioAdmin[]> {
    const params = filtroRol ? { rol: filtroRol } : undefined;
    return this.http.get<UsuarioAdmin[]>(this.apiUrl, { params });
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
