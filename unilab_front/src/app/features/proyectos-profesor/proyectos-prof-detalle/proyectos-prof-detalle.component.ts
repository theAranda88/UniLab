import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProyectosService } from '../../proyectos-estudiante/proyectos.service';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ProjectImageCarouselComponent } from '../../home/project-image-carousel/project-image-carousel.component';
import type { Proyecto } from '../../../core/models/proyecto.model';
import { urlsImagenesProyecto } from '../../../core/models/portal.model';

@Component({
  selector: 'app-proyectos-prof-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, ProjectImageCarouselComponent],
  templateUrl: './proyectos-prof-detalle.component.html',
  styleUrl: './proyectos-prof-detalle.component.scss',
})
export class ProyectosProfDetalleComponent implements OnInit {
  readonly proyectosService = inject(ProyectosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);

  readonly cargando = signal(false);
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);
  readonly proyecto = signal<Proyecto | null>(null);

  readonly puedeRevisar = computed(() => {
    const p = this.proyecto();
    return p ? this.proyectosService.puedeRevisar(p) : false;
  });

  readonly puedePublicar = computed(() => {
    const p = this.proyecto();
    return p ? this.proyectosService.puedePublicar(p) : false;
  });

  readonly imagenes = computed(() => {
    const p = this.proyecto();
    return p ? urlsImagenesProyecto(p) : [];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.proyectosService.obtener(id).subscribe({
      next: (data) => {
        if (!this.proyectosService.esAsignadoAMi(data)) {
          this.error.set('proyectosProfesor.sinPermiso');
          this.cargando.set(false);
          return;
        }
        this.proyecto.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('proyectosProfesor.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate([this.proyectosService.getBasePath()]);
  }

  nombreEstudiante(p: Proyecto): string {
    const e = p.estudiante_creador;
    return e ? `${e.nombres} ${e.apellidos}` : '—';
  }

  async aprobar(): Promise<void> {
    const p = this.proyecto();
    if (!p || !this.puedeRevisar()) return;

    const ok = await this.dialog.confirm({
      titleKey: 'proyectosProfesor.aprobarTitulo',
      messageKey: 'proyectosProfesor.aprobarMensaje',
      confirmKey: 'proyectosProfesor.aprobar',
    });
    if (!ok) return;

    this.cambiarEstado(p.id_proyecto, 'publicado', 'proyectosProfesor.exitoAprobar');
  }

  async rechazar(): Promise<void> {
    const p = this.proyecto();
    if (!p || !this.puedeRevisar()) return;

    const ok = await this.dialog.confirm({
      titleKey: 'proyectosProfesor.rechazarTitulo',
      messageKey: 'proyectosProfesor.rechazarMensaje',
      confirmKey: 'proyectosProfesor.rechazar',
      destructive: true,
    });
    if (!ok) return;

    this.cambiarEstado(p.id_proyecto, 'rechazado', 'proyectosProfesor.exitoRechazar');
  }

  async publicar(): Promise<void> {
    const p = this.proyecto();
    if (!p || !this.puedePublicar()) return;

    const ok = await this.dialog.confirm({
      titleKey: 'proyectosProfesor.publicarTitulo',
      messageKey: 'proyectosProfesor.publicarMensaje',
      confirmKey: 'proyectosProfesor.publicar',
    });
    if (!ok) return;

    this.cambiarEstado(p.id_proyecto, 'publicado', 'proyectosProfesor.exitoPublicar');
  }

  private cambiarEstado(
    id: number,
    estado: 'aprobado' | 'rechazado' | 'publicado',
    mensajeExitoKey: string,
  ): void {
    this.procesando.set(true);
    this.proyectosService.cambiarEstado(id, { estado_proyecto: estado }).subscribe({
      next: (actualizado) => {
        this.proyecto.set(actualizado);
        this.procesando.set(false);
        void this.dialog.success({ messageKey: mensajeExitoKey });
      },
      error: (err: { message?: string }) => {
        this.procesando.set(false);
        void this.dialog.error({
          message: err.message ?? this.translate.instant('proyectosProfesor.errorEstado'),
        });
      },
    });
  }

  verPublico(): void {
    const id = this.proyecto()?.id_proyecto;
    if (id) {
      window.open(`/proyectos/${id}`, '_blank', 'noopener,noreferrer');
    }
  }
}
