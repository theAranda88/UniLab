import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ResumenGlobal } from '../../core/models/reporte.model';

/** RA-012 · Reporte global de la plataforma (Administrador y Coordinador). */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/reportes';

  resumen(): Observable<ResumenGlobal> {
    return this.http.get<ResumenGlobal>(`${this.apiUrl}/resumen`);
  }

  exportarExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/resumen/export/excel`, { responseType: 'blob' });
  }
}
