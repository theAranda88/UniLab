import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Curso } from '../../core/models/portal.model';
import { environment } from '../../../environments/environment';

export interface CursoDto {
  id_escuela: number;
  nombre_curso: string;
  periodo_academico: string;
}

/** RA-003 · CRUD de cursos (mutaciones solo Administrador). */
@Injectable({ providedIn: 'root' })
export class CursosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cursos`;

  listar(idEscuela?: number): Observable<Curso[]> {
    const params = idEscuela ? { id_escuela: idEscuela } : undefined;
    return this.http.get<Curso[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/${id}`);
  }

  crear(data: CursoDto): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<CursoDto>): Observable<Curso> {
    return this.http.patch<Curso>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
