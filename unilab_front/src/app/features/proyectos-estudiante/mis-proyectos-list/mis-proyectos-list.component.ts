import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProyectosService } from '../proyectos.service';
import { AuthService } from '../../../core/auth/auth.service';
import { hasPortalTheme } from '../../../core/utils/portal-theme.util';
import type { Proyecto } from '../../../core/models/proyecto.model';
import { urlsImagenesProyecto } from '../../../core/models/portal.model';

import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-mis-proyectos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './mis-proyectos-list.component.html',
  styleUrl: './mis-proyectos-list.component.scss',
  host: {
    '[class.portal-themed]': 'portalTheme()',
  },
})
export class MisProyectosListComponent implements OnInit {
  private proyectosService = inject(ProyectosService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly portalTheme = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly proyectos = signal<Proyecto[]>([]);
  readonly filtroEstado = signal<string>('');

  readonly puedeCrear = computed(() => this.proyectosService.puedeCrear());

  readonly estadosFiltro = [
    '',
    'borrador',
    'en_revision',
    'aprobado',
    'publicado',
    'rechazado',
  ] as const;

  readonly misProyectos = computed(() => {
    const userId = this.auth.getCurrentUser()?.id_usuario;
    if (!userId) return [];

    let list = this.proyectos().filter((p) => p.id_estudiante_creador === userId);

    const estado = this.filtroEstado();
    if (estado) {
      list = list.filter((p) => p.estado_proyecto === estado);
    }

    return list;
  });

  ngOnInit(): void {
    this.portalTheme.set(hasPortalTheme(this.route));
    this.cargar();
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.proyectosService.listar().subscribe({
      next: (data) => {
        this.proyectos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('proyectosEstudiante.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.router.navigate(['/mis-proyectos', 'nuevo']);
  }

  gestionar(id: number): void {
    this.router.navigate(['/mis-proyectos', id]);
  }

  verPublico(id: number): void {
    this.router.navigate(['/proyectos', id]);
  }

  portada(proyecto: Proyecto): string | null {
    const urls = urlsImagenesProyecto(proyecto);
    return urls[0] ?? null;
  }
}
