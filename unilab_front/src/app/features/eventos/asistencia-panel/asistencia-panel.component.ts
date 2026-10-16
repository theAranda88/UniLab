import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { EventosService } from '../eventos.service';
import type { Evento, EventoJornada } from '../../../core/models/evento.model';
import { formatearFechaLocal } from '../../../core/utils/date.util';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

type FiltroEstado = '' | Evento['estado'];

interface EventoAsistencia {
  evento: Evento;
  jornadas: EventoJornada[];
}

/**
 * Control de asistencia (ADM, COO): cada evento con sus jornadas y accesos al QR de la jornada,
 * al registro manual por código y al reporte de participantes.
 */
@Component({
  selector: 'app-asistencia-panel',
  standalone: true,
  imports: [RouterLink, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './asistencia-panel.component.html',
  styleUrl: './asistencia-panel.component.scss',
})
export class AsistenciaPanelComponent implements OnInit {
  readonly eventoService = inject(EventosService);

  readonly estados: FiltroEstado[] = ['', 'activo', 'planeado', 'finalizado'];
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<EventoAsistencia[]>([]);
  readonly filtro = signal<FiltroEstado>('');

  readonly base = this.eventoService.getBasePath();

  /** Activos primero; luego por fecha de inicio. */
  readonly filtrados = computed(() => {
    const orden: Record<Evento['estado'], number> = { activo: 0, planeado: 1, finalizado: 2 };
    const estado = this.filtro();
    return this.items()
      .filter((i) => !estado || i.evento.estado === estado)
      .sort(
        (a, b) =>
          orden[a.evento.estado] - orden[b.evento.estado] ||
          a.evento.fecha_inicio.localeCompare(b.evento.fecha_inicio),
      );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.eventoService.listar().subscribe({
      next: (eventos) => {
        if (eventos.length === 0) {
          this.items.set([]);
          this.cargando.set(false);
          return;
        }
        forkJoin(
          eventos.map((evento) =>
            this.eventoService.obtenerJornadas(evento.id_evento).pipe(
              map((jornadas) => ({ evento, jornadas })),
              catchError(() => of({ evento, jornadas: [] as EventoJornada[] })),
            ),
          ),
        ).subscribe((items) => {
          this.items.set(items);
          this.cargando.set(false);
        });
      },
      error: () => {
        this.error.set('asistenciaPanel.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  formatearFecha(fecha: string): string {
    return formatearFechaLocal(fecha);
  }

  formatearHora(hora: string): string {
    if (!hora) return '—';
    const match = hora.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
    return hora.length >= 5 && hora.includes(':') ? hora.substring(0, 5) : hora;
  }
}
