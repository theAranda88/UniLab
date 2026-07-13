import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Evento,
  EventoJornada,
  Inscripcion,
  Asistencia,
  CreateEventoDto,
  CreateJornadaDto,
  CreateInscripcionDto,
  RegistrarAsistenciaDto,
  ReporteEvento,
} from '../../core/models/evento.model';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/eventos';

  // Eventos
  listar(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}`);
  }

  obtener(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  crear(data: CreateEventoDto): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}`, data);
  }

  // Jornadas
  crearJornada(idEvento: number, data: CreateJornadaDto): Observable<EventoJornada> {
    return this.http.post<EventoJornada>(
      `${this.apiUrl}/${idEvento}/jornadas`,
      data
    );
  }

  obtenerJornadas(idEvento: number): Observable<EventoJornada[]> {
    return this.http.get<EventoJornada[]>(`${this.apiUrl}/${idEvento}/jornadas`);
  }

  // Inscripciones
  inscribirse(idEvento: number, data: CreateInscripcionDto): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(
      `${this.apiUrl}/${idEvento}/inscripciones`,
      data
    );
  }

  // Asistencias (QR)
  registrarAsistencia(codigo_qr: string): Observable<Asistencia> {
    return this.http.post<Asistencia>(
      `${this.apiUrl}/asistencias/registrar`,
      { codigo_qr },
    );
  }

  // Reportes
  obtenerReporte(idEvento: number): Observable<ReporteEvento> {
    return this.http.get<ReporteEvento>(`${this.apiUrl}/${idEvento}/reportes`);
  }

  // Exportar
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
}
