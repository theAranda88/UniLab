import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Evento,
  EventoJornada,
  Inscripcion,
  Asistencia,
  CreateEventoDto,
  UpdateEventoDto,
  CreateJornadaDto,
  CreateInscripcionDto,
  MiInscripcionResponse,
  ReporteEvento,
  JornadaEvidencia,
} from '../../core/models/evento.model';
import { AuthService } from '../../core/auth/auth.service';
import { getEventosBasePath } from '../../core/config/eventos-paths';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/eventos';
  private jornadasUrl = 'http://localhost:3000/api/jornadas';
  private inscripcionesUrl = 'http://localhost:3000/api/inscripciones';

  getBasePath(): string {
    return getEventosBasePath(this.authService.getCurrentUser()?.id_rol);
  }

  puedeCrear(): boolean {
    return this.authService.hasRole('Administrador');
  }

  puedeEditar(): boolean {
    return this.authService.hasRole('Administrador');
  }

  puedeEliminar(): boolean {
    return this.authService.hasRole('Administrador');
  }

  puedeVerReportes(): boolean {
    return this.authService.hasAnyRole(['Administrador', 'Coordinador']);
  }

  puedeGestionarEvidencias(): boolean {
    return this.authService.hasAnyRole(['Administrador', 'Coordinador']);
  }

  puedeListarInscripciones(): boolean {
    return this.authService.hasAnyRole(['Administrador', 'Coordinador']);
  }

  puedeActualizarPago(): boolean {
    return this.authService.hasRole('Administrador');
  }

  puedeInscribirse(): boolean {
    return !this.authService.hasRole('Administrador');
  }

  puedeAsistenciaManual(): boolean {
    return this.authService.hasAnyRole(['Administrador', 'Coordinador', 'Profesor']);
  }

  esAsistenciaSoloQr(): boolean {
    return this.authService.hasAnyRole(['Estudiante', 'Externo']);
  }

  listar(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}`);
  }

  obtener(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  crear(data: CreateEventoDto): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}`, data);
  }

  actualizar(id: number, data: UpdateEventoDto): Observable<Evento> {
    return this.http.patch<Evento>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarInscripciones(idEvento: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/${idEvento}/inscripciones`);
  }

  obtenerMiInscripcion(idEvento: number): Observable<MiInscripcionResponse> {
    return this.http.get<MiInscripcionResponse>(`${this.apiUrl}/${idEvento}/mi-inscripcion`);
  }

  crearJornada(idEvento: number, data: CreateJornadaDto): Observable<EventoJornada> {
    return this.http.post<EventoJornada>(`${this.apiUrl}/${idEvento}/jornadas`, data);
  }

  obtenerJornadas(idEvento: number): Observable<EventoJornada[]> {
    return this.http.get<EventoJornada[]>(`${this.apiUrl}/${idEvento}/jornadas`);
  }

  inscribirse(idEvento: number, data: CreateInscripcionDto): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${this.apiUrl}/${idEvento}/inscripciones`, data);
  }

  actualizarPago(
    idInscripcion: number,
    estado_pago: 'pendiente' | 'confirmado' | 'exento',
  ): Observable<Inscripcion> {
    return this.http.patch<Inscripcion>(`${this.inscripcionesUrl}/${idInscripcion}/pago`, {
      estado_pago,
    });
  }

  registrarAsistencia(codigo_qr: string): Observable<Asistencia> {
    return this.http.post<Asistencia>(`${this.apiUrl}/asistencias/registrar`, { codigo_qr });
  }

  obtenerReporte(idEvento: number): Observable<ReporteEvento> {
    return this.http.get<ReporteEvento>(`${this.apiUrl}/${idEvento}/reportes`);
  }

  exportarCSV(idEvento: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idEvento}/reportes/export/csv`, {
      responseType: 'blob',
    });
  }

  exportarExcel(idEvento: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idEvento}/reportes/export/excel`, {
      responseType: 'blob',
    });
  }

  subirFlyer(idEvento: number, file: File): Observable<{ url_flyer: string }> {
    const formData = new FormData();
    formData.append('flyer', file);
    return this.http.post<{ url_flyer: string }>(`${this.apiUrl}/${idEvento}/flyer`, formData);
  }

  eliminarFlyer(idEvento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idEvento}/flyer`);
  }

  listarEvidenciasJornada(idJornada: number): Observable<JornadaEvidencia[]> {
    return this.http.get<JornadaEvidencia[]>(`${this.jornadasUrl}/${idJornada}/evidencias`);
  }

  subirEvidenciasJornada(idJornada: number, files: File[]): Observable<JornadaEvidencia[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('evidencias', file);
    }
    return this.http.post<JornadaEvidencia[]>(
      `${this.jornadasUrl}/${idJornada}/evidencias`,
      formData,
    );
  }

  eliminarEvidenciaJornada(idJornada: number, idEvidencia: number): Observable<void> {
    return this.http.delete<void>(
      `${this.jornadasUrl}/${idJornada}/evidencias/${idEvidencia}`,
    );
  }
}
