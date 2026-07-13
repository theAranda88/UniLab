import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DASHBOARD_MOCK } from '../../../core/config/dashboard-mock-data';
import { EventosService } from '../../eventos/eventos.service';
import { Inscripcion } from '../../../core/models/evento.model';

export interface PendingPaymentItem {
  id_evento: number;
  nombre_evento: string;
  inscripcion: Inscripcion;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private eventosService = inject(EventosService);
  private router = inject(Router);

  mock = DASHBOARD_MOCK.Administrador;
  pendingPayments = signal<PendingPaymentItem[]>([]);
  cargandoPagos = signal(false);
  actualizandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarPagosPendientes();
  }

  cargarPagosPendientes(): void {
    this.cargandoPagos.set(true);
    this.eventosService.listar().subscribe({
      next: (eventos) => {
        const conPago = eventos.filter((e) => e.requiere_pago);
        if (conPago.length === 0) {
          this.pendingPayments.set([]);
          this.cargandoPagos.set(false);
          return;
        }

        const requests = conPago.map((evento) =>
          this.eventosService.listarInscripciones(evento.id_evento).pipe(
            map((inscripciones) =>
              inscripciones
                .filter((i) => i.estado_pago === 'pendiente')
                .map((inscripcion) => ({
                  id_evento: evento.id_evento,
                  nombre_evento: evento.nombre_evento,
                  inscripcion,
                })),
            ),
            catchError(() => of([] as PendingPaymentItem[])),
          ),
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            this.pendingPayments.set(results.flat().slice(0, 5));
            this.cargandoPagos.set(false);
          },
          error: () => this.cargandoPagos.set(false),
        });
      },
      error: () => this.cargandoPagos.set(false),
    });
  }

  confirmarPago(item: PendingPaymentItem): void {
    this.actualizandoId.set(item.inscripcion.id_inscripcion);
    this.eventosService
      .actualizarPago(item.inscripcion.id_inscripcion, 'confirmado')
      .subscribe({
        next: () => {
          this.actualizandoId.set(null);
          this.cargarPagosPendientes();
        },
        error: () => this.actualizandoId.set(null),
      });
  }

  irAEvento(idEvento: number): void {
    if (idEvento) {
      this.router.navigate(['/admin/eventos', idEvento, 'reporte']);
    }
  }
}
