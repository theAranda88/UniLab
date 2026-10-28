import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { CalificacionProyecto, ComentarioProyecto } from '../../core/models/portal.model';

/**
 * Calificar y comentar proyectos publicados. Usa los endpoints existentes del backend
 * (PUT /proyectos/:id/calificacion, POST /proyectos/:id/comentarios), que exigen sesión.
 */
@Injectable({ providedIn: 'root' })
export class ProyectoInteraccionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/proyectos';

  /** Crea o reemplaza la calificación (1–5) del usuario actual. */
  calificar(idProyecto: number, puntuacion: number): Observable<CalificacionProyecto> {
    return this.http.put<CalificacionProyecto>(`${this.apiUrl}/${idProyecto}/calificacion`, { puntuacion });
  }

  /** Comentario nuevo o, con `idPadre`, respuesta a otro comentario. */
  comentar(idProyecto: number, contenido: string, idPadre?: number): Observable<ComentarioProyecto> {
    return this.http.post<ComentarioProyecto>(`${this.apiUrl}/${idProyecto}/comentarios`, {
      contenido,
      ...(idPadre ? { id_comentario_padre: idPadre } : {}),
    });
  }
}
