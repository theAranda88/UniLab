import { Injectable, signal } from '@angular/core';

export type SeccionPortal = 'inicio' | 'proyectos' | 'eventos';

/**
 * Sección del inicio que el usuario está viendo (la publica el inicio al desplazarse).
 * El navbar la usa para marcar «Inicio», «Proyectos» o «Eventos» dentro de la misma página.
 */
@Injectable({ providedIn: 'root' })
export class PortalSeccionService {
  readonly seccion = signal<SeccionPortal | null>(null);
}
