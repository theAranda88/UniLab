import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { EventosService } from '../../../features/eventos/eventos.service';
import { ProyectosService } from '../../../features/proyectos-estudiante/proyectos.service';
import type { ShellRole } from '../../../core/config/nav-by-role';

export interface ShellNotification {
  icon: string;
  /** Texto principal (dato real: evento, proyecto). */
  title: string;
  /** Clave i18n del detalle. */
  detailKey: string;
  detailParams?: Record<string, string>;
  route: (string | number)[];
}

/**
 * Notificaciones del topbar, derivadas de datos que ya existen en la API:
 * - Administrador: inscripciones con pago pendiente.
 * - Profesor: proyectos asignados que esperan revisión.
 * - Coordinador: sin fuente de notificaciones en la API (lista vacía).
 */
@Injectable({ providedIn: 'root' })
export class ShellNotificationsService {
  private eventos = inject(EventosService);
  private proyectos = inject(ProyectosService);

  load(role: ShellRole, prefix: string): Observable<ShellNotification[]> {
    switch (role) {
      case 'Administrador':
        return this.pagosPendientes(prefix);
      case 'Profesor':
        return this.proyectosPorRevisar(prefix);
      default:
        return of([]);
    }
  }

  private pagosPendientes(prefix: string): Observable<ShellNotification[]> {
    return this.eventos.listar().pipe(
      switchMap((eventos) => {
        const conPago = eventos.filter((e) => e.requiere_pago);
        if (conPago.length === 0) return of([] as ShellNotification[][]);
        return forkJoin(
          conPago.map((evento) =>
            this.eventos.listarInscripciones(evento.id_evento).pipe(
              map((inscripciones) =>
                inscripciones
                  .filter((i) => i.estado_pago === 'pendiente')
                  .map<ShellNotification>((i) => ({
                    icon: 'ti-cash',
                    title: evento.nombre_evento,
                    detailKey: 'shell.notifications.pagoPendiente',
                    detailParams: { nombre: i.nombre_completo },
                    route: [prefix, 'eventos', evento.id_evento, 'reporte'],
                  })),
              ),
              catchError(() => of([] as ShellNotification[])),
            ),
          ),
        );
      }),
      map((grupos) => grupos.flat()),
      catchError(() => of([])),
    );
  }

  private proyectosPorRevisar(prefix: string): Observable<ShellNotification[]> {
    return this.proyectos.listar().pipe(
      map((lista) =>
        lista
          .filter((p) => this.proyectos.esAsignadoAMi(p) && p.estado_proyecto === 'en_revision')
          .map<ShellNotification>((p) => ({
            icon: 'ti-clock-check',
            title: p.titulo,
            detailKey: 'shell.notifications.proyectoRevision',
            route: [prefix, 'proyectos', p.id_proyecto],
          })),
      ),
      catchError(() => of([])),
    );
  }
}
