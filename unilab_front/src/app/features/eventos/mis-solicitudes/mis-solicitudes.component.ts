import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from '../eventos.service';
import type { Evento } from '../../../core/models/evento.model';
import { EventoCardComponent } from '../../../shared/ui/evento-card/evento-card.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

/** Portal del usuario Externo: sus solicitudes de evento y su estado (pendiente, aprobada o rechazada). */
@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [RouterModule, TranslatePipe, EventoCardComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './mis-solicitudes.component.html',
  styleUrl: './mis-solicitudes.component.scss',
})
export class MisSolicitudesComponent implements OnInit {
  private eventosService = inject(EventosService);

  readonly solicitudes = signal<Evento[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.eventosService.misSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }
}
