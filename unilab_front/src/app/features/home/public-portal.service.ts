import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Curso, Escuela, ProyectoPublico } from '../../core/models/portal.model';

const API = 'http://localhost:3000/api/public';

@Injectable({ providedIn: 'root' })
export class PublicPortalService {
  private http = inject(HttpClient);

  listarEscuelas(): Observable<Escuela[]> {
    return this.http.get<Escuela[]>(`${API}/escuelas`);
  }

  listarCursos(idEscuela: number): Observable<Curso[]> {
    const params = new HttpParams().set('id_escuela', idEscuela.toString());
    return this.http.get<Curso[]>(`${API}/cursos`, { params });
  }

  listarProyectos(idEscuela: number): Observable<ProyectoPublico[]> {
    const params = new HttpParams().set('id_escuela', idEscuela.toString());
    return this.http.get<ProyectoPublico[]>(`${API}/proyectos`, { params });
  }

  obtenerProyecto(idProyecto: number): Observable<ProyectoPublico> {
    return this.http.get<ProyectoPublico>(`${API}/proyectos/${idProyecto}`);
  }
}
