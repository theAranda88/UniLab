import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { Evento } from '../../core/models/evento.model';
import { formatearFechaLocal } from '../../core/utils/date.util';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.scss',
})
export class EventosListComponent implements OnInit {
  eventoService = inject(EventosService);
  private router = inject(Router);

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

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.cargando.set(true);
    this.error.set(null);

    this.eventoService.listar().subscribe({
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

  formatearFecha(fecha: string): string {
    return formatearFechaLocal(fecha);
  }
}
