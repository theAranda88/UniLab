import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProyectosService } from '../../proyectos-estudiante/proyectos.service';
import type { Proyecto, TipoProyecto } from '../../../core/models/proyecto.model';

@Component({
  selector: 'app-proyectos-prof-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './proyectos-prof-list.component.html',
  styleUrl: './proyectos-prof-list.component.scss',
})
export class ProyectosProfListComponent implements OnInit {
  private proyectosService = inject(ProyectosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly proyectos = signal<Proyecto[]>([]);
  readonly filtroEstado = signal<string>('');
  readonly soloPendientes = signal(false);

  readonly estadosFiltro = [
    '',
    'en_revision',
    'aprobado',
    'borrador',
    'publicado',
    'rechazado',
  ] as const;

  readonly proyectosAsignados = computed(() => {
    let list = this.proyectos().filter((p) => this.proyectosService.esAsignadoAMi(p));

    const estado = this.filtroEstado();
    if (estado) {
      list = list.filter((p) => p.estado_proyecto === estado);
    }

    return list;
  });

  readonly pendientesCount = computed(
    () =>
      this.proyectos().filter(
        (p) =>
          this.proyectosService.esAsignadoAMi(p) && p.estado_proyecto === 'en_revision',
      ).length,
  );

  ngOnInit(): void {
    const filtroInicial = this.route.snapshot.data['filtroInicial'] as string | undefined;
    this.soloPendientes.set(this.route.snapshot.routeConfig?.path === 'pendientes');
    if (filtroInicial) {
      this.filtroEstado.set(filtroInicial);
    }
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
        this.error.set('proyectosProfesor.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  verDetalle(id: number): void {
    this.router.navigate([this.proyectosService.getBasePath(), id]);
  }

  nombreEstudiante(proyecto: Proyecto): string {
    const e = proyecto.estudiante_creador;
    return e ? `${e.nombres} ${e.apellidos}` : '—';
  }

  trackById(_: number, item: Proyecto): number {
    return item.id_proyecto;
  }
}
