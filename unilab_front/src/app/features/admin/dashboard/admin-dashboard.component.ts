import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EventosService } from '../../eventos/eventos.service';
import { ReportesService } from '../../reportes/reportes.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Evento, Inscripcion } from '../../../core/models/evento.model';
import type { ResumenGlobal } from '../../../core/models/reporte.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { fechaLarga, proximosEventos, saludoKey } from '../../../shared/layout/dashboard/dashboard.util';

export interface PendingPaymentItem {
  id_evento: number;
  nombre_evento: string;
  inscripcion: Inscripcion;
}

/** Inicio del panel del Administrador: cifras reales, tareas pendientes y próximos eventos. */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, SkeletonComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private eventosService = inject(EventosService);
  private reportes = inject(ReportesService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  readonly resumen = signal<ResumenGlobal | null>(null);
  readonly eventos = signal<Evento[]>([]);
  readonly pendingPayments = signal<PendingPaymentItem[]>([]);
  readonly cargando = signal(true);
  readonly cargandoPagos = signal(true);
  readonly actualizandoId = signal<number | null>(null);

  private readonly idioma = this.translate.getCurrentLang() ?? 'es';
  readonly saludo = saludoKey();
  readonly fecha = fechaLarga(this.idioma);
  readonly nombre = this.auth.getCurrentUser()?.nombres?.split(' ')[0] ?? '';

  readonly proximos = computed(() => proximosEventos(this.eventos(), this.idioma));

  /** Conteos por estado que piden acción (salen del resumen global). */
  readonly enRevision = computed(
    () => this.resumen()?.proyectos_por_estado.find((p) => p.estado === 'en_revision')?.total ?? 0,
  );
  readonly solicitudesPendientes = computed(
    () => this.resumen()?.membresias_por_estado.find((m) => m.estado === 'pendiente')?.total ?? 0,
  );
  readonly hayPendientes = computed(
    () => this.pendingPayments().length > 0 || this.enRevision() > 0 || this.solicitudesPendientes() > 0,
  );

  ngOnInit(): void {
    forkJoin({
      resumen: this.reportes.resumen().pipe(catchError(() => of(null))),
      eventos: this.eventosService.listar().pipe(catchError(() => of([] as Evento[]))),
    }).subscribe(({ resumen, eventos }) => {
      this.resumen.set(resumen);
      this.eventos.set(eventos);
      this.cargando.set(false);
      this.cargarPagosPendientes(eventos);
    });
  }

  /** Inscripciones con pago pendiente en eventos que lo requieren (máx. 5). */
  private cargarPagosPendientes(eventos: Evento[]): void {
    const conPago = eventos.filter((e) => e.requiere_pago);
    if (conPago.length === 0) {
      this.pendingPayments.set([]);
      this.cargandoPagos.set(false);
      return;
    }
    forkJoin(
      conPago.map((evento) =>
        this.eventosService.listarInscripciones(evento.id_evento).pipe(
          map((inscripciones) =>
            inscripciones
              .filter((i) => i.estado_pago === 'pendiente')
              .map((inscripcion) => ({ id_evento: evento.id_evento, nombre_evento: evento.nombre_evento, inscripcion })),
          ),
          catchError(() => of([] as PendingPaymentItem[])),
        ),
      ),
    ).subscribe((resultados) => {
      this.pendingPayments.set(resultados.flat().slice(0, 5));
      this.cargandoPagos.set(false);
    });
  }

  confirmarPago(item: PendingPaymentItem): void {
    this.actualizandoId.set(item.inscripcion.id_inscripcion);
    this.eventosService.actualizarPago(item.inscripcion.id_inscripcion, 'confirmado').subscribe({
      next: () => {
        this.actualizandoId.set(null);
        this.toast.success('eventos.exitoPago');
        this.pendingPayments.update((lista) =>
          lista.filter((p) => p.inscripcion.id_inscripcion !== item.inscripcion.id_inscripcion),
        );
      },
      error: () => this.actualizandoId.set(null),
    });
  }
}
