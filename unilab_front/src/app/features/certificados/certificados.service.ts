import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Certificado,
  CertificadoVerificado,
  CertificadosEvento,
  ResultadoEmision,
} from '../../core/models/certificado.model';

@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  resumenEvento(idEvento: number): Observable<CertificadosEvento> {
    return this.http.get<CertificadosEvento>(`${this.api}/eventos/${idEvento}/certificados`);
  }

  emitir(idEvento: number): Observable<ResultadoEmision> {
    return this.http.post<ResultadoEmision>(`${this.api}/eventos/${idEvento}/certificados`, {});
  }

  anular(idCertificado: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/certificados/${idCertificado}`);
  }

  misCertificados(): Observable<Certificado[]> {
    return this.http.get<Certificado[]>(`${this.api}/certificados/mios`);
  }

  descargar(idCertificado: number): Observable<Blob> {
    return this.http.get(`${this.api}/certificados/${idCertificado}/pdf`, { responseType: 'blob' });
  }

  /** Inscritos sin cuenta: cédula y correo con que se inscribieron. */
  descargarPublico(idEvento: number, documento_identidad: string, email: string): Observable<Blob> {
    return this.http.post(
      `${this.api}/public/eventos/${idEvento}/certificado`,
      { documento_identidad, email },
      { responseType: 'blob' },
    );
  }

  verificar(codigo: string): Observable<CertificadoVerificado> {
    return this.http.get<CertificadoVerificado>(`${this.api}/public/certificados/${codigo}`);
  }
}

/** Guarda el PDF recibido con un nombre legible. */
export function guardarPdf(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function nombrePdf(evento: string, persona: string): string {
  const limpio = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  return `certificado-${limpio(evento)}-${limpio(persona)}.pdf`;
}
