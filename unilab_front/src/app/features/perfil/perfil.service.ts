import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FormacionAcademica, FormacionDto, PerfilPublico } from '../../core/models/usuario.model';

/** Formación del usuario en sesión y perfiles públicos (tipo CvLAC). */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private auth = `${environment.apiUrl}/auth/me/formacion`;

  listarFormacion(): Observable<FormacionAcademica[]> {
    return this.http.get<FormacionAcademica[]>(this.auth);
  }

  crearFormacion(data: FormacionDto): Observable<FormacionAcademica> {
    return this.http.post<FormacionAcademica>(this.auth, data);
  }

  actualizarFormacion(id: number, data: FormacionDto): Observable<FormacionAcademica> {
    return this.http.put<FormacionAcademica>(`${this.auth}/${id}`, data);
  }

  eliminarFormacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.auth}/${id}`);
  }

  perfilPublico(idUsuario: number): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${environment.apiUrl}/public/usuarios/${idUsuario}/perfil`);
  }
}
