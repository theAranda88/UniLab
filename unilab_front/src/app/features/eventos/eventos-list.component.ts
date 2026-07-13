import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventosService } from './eventos.service';
import { Evento } from '../../core/models/evento.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.scss',
})
export class EventosListComponent implements OnInit {
  private eventoService = inject(EventosService);
  private authService = inject(AuthService);
  private router = inject(Router);

  eventos = signal<Evento[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  filtroEstado = signal<string>('');
  filtroTipo = signal<string>('');

  usuarioRol = signal<string | null>(null);

  eventosFiltrados = computed(() => {
    let filtered = this.eventos();

    if (this.filtroEstado()) {
      filtered = filtered.filter((e) => e.estado === this.filtroEstado());
    }

    if (this.filtroTipo()) {
      filtered = filtered.filter((e) => e.tipo_evento.toLowerCase().includes(this.filtroTipo().toLowerCase()));
    }

    return filtered;
  });

  ngOnInit() {
    this.cargarEventos();
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.usuarioRol.set(user.id_rol);
      }
    });
  }

  cargarEventos() {
    this.cargando.set(true);
    this.error.set(null);

    this.eventoService.listar().subscribe({
      next: (data: Evento[]) => {
        this.eventos.set(data);
        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar eventos:', err);
        this.error.set('Error al cargar los eventos');
        this.cargando.set(false);
      },
    });
  }

  crearEvento() {
    this.router.navigate(['/eventos/crear']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/eventos', id]);
  }

  esAdmin(): boolean {
    return this.usuarioRol() === 'Administrador';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString();
  }
}
