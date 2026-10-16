import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { PublicPortalService } from '../home/public-portal.service';
import { AuthService } from '../../core/auth/auth.service';
import { Evento } from '../../core/models/evento.model';
import { momentoEvento, type MomentoEvento } from '../../core/utils/date.util';
import { EventoCardComponent } from '../../shared/ui/evento-card/evento-card.component';
import { hasPortalTheme } from '../../core/utils/portal-theme.util';
import type { UiVariant } from '../../shared/ui/ui-variant';

import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, EmptyStateComponent, SkeletonComponent, EventoCardComponent],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.scss',
  host: {
    '[class.portal-themed]': 'portalTheme()',
  },
})
export class EventosListComponent implements OnInit {
  eventoService = inject(EventosService);
  private portal = inject(PublicPortalService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly portalTheme = signal(false);
  readonly uiVariant = computed<UiVariant>(() => (this.portalTheme() ? 'portal' : 'default'));

  readonly estadosFiltro = ['', 'planeado', 'activo', 'finalizado'] as const;

  eventos = signal<Evento[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  filtroEstado = signal<string>('');
  filtroTipo = signal<string>('');

  puedeCrear = computed(() => this.eventoService.puedeCrear());

  eventosFiltrados = computed(() => {
    let filtered = this.eventos();

    if (this.filtroEstado()) {
      filtered = filtered.filter((e) => e.estado === this.filtroEstado());
    }

    if (this.filtroTipo()) {
      filtered = filtered.filter((e) =>
        e.tipo_evento.toLowerCase().includes(this.filtroTipo().toLowerCase()),
      );
    }

    return filtered;
  });

  /** Vigentes primero (en curso, luego próximos por fecha) y al final los ya finalizados. */
  eventosOrdenados = computed(() => {
    const orden: Record<MomentoEvento, number> = { en_curso: 0, proximo: 1, pasado: 2 };
    return this.eventosFiltrados()
      .map((evento) => ({ evento, momento: momentoEvento(evento.fecha_inicio, evento.fecha_fin) }))
      .sort((a, b) => {
        if (a.momento !== b.momento) return orden[a.momento] - orden[b.momento];
        const cmp = a.evento.fecha_inicio.localeCompare(b.evento.fecha_inicio);
        return a.momento === 'pasado' ? -cmp : cmp;
      });
  });

  ngOnInit() {
    this.portalTheme.set(hasPortalTheme(this.route));
    this.cargarEventos();
  }

  setFiltroEstado(estado: string) {
    this.filtroEstado.set(estado);
  }

  cargarEventos() {
    this.cargando.set(true);
    this.error.set(null);

    const request = this.auth.isAuthenticated()
      ? this.eventoService.listar()
      : this.portal.listarEventosActivos();

    request.subscribe({
      next: (data: Evento[]) => {
        this.eventos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('eventos.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  crearEvento() {
    this.router.navigate([this.eventoService.getBasePath(), 'crear']);
  }

  verDetalle(id: number) {
    this.router.navigate([this.eventoService.getBasePath(), id]);
  }

}
