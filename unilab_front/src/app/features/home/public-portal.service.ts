import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Curso, Escuela, ProyectoPublico } from '../../core/models/portal.model';
import type {
  Evento,
  Inscripcion,
  MiInscripcionResponse,
  CreateInscripcionDto,
  Asistencia,
} from '../../core/models/evento.model';

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

  listarEventosActivos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${API}/eventos`);
  }

  obtenerEventoActivo(idEvento: number): Observable<Evento> {
    return this.http.get<Evento>(`${API}/eventos/${idEvento}`);
  }

  consultarInscripcionEvento(
    idEvento: number,
    documento_identidad: string,
  ): Observable<MiInscripcionResponse> {
    const params = new HttpParams().set('documento_identidad', documento_identidad);
    return this.http.get<MiInscripcionResponse>(`${API}/eventos/${idEvento}/inscripcion`, {
      params,
    });
  }

  inscribirEvento(idEvento: number, data: Omit<CreateInscripcionDto, 'tipo_asistente'>): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${API}/eventos/${idEvento}/inscripciones`, data);
  }

  registrarAsistenciaPublica(
    codigo_qr: string,
    documento_identidad: string,
  ): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${API}/asistencias/registrar`, {
      codigo_qr,
      documento_identidad,
    });
  }
}
