import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import type { Curso, Escuela, ProyectoPublico } from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

/**
 * Pantalla 22 · Portal — una escuela (descripción, color e imágenes), sus programas y sus
 * proyectos publicados.
 * Escucha el parámetro de ruta: al pasar de una escuela a otra el componente se reutiliza.
 */
@Component({
  selector: 'app-portal-escuela-proyectos',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ProyectoCardComponent,
    ProjectImageCarouselComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './portal-escuela-proyectos.component.html',
  styleUrl: './portal-escuela-proyectos.component.scss',
})
export class PortalEscuelaProyectosComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);

  readonly escuelas = signal<Escuela[]>([]);
  readonly idEscuela = signal<number | null>(null);
  readonly proyectos = signal<ProyectoPublico[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly filtroTipo = signal<string | null>(null);

  readonly escuela = computed(() => this.escuelas().find((e) => e.id_escuela === this.idEscuela()) ?? null);
  readonly estilo = computed(() => estiloDeEscuela(this.escuela()));
  readonly imagenes = computed(() =>
    [...(this.escuela()?.imagenes ?? [])].sort((a, b) => a.orden - b.orden).map((img) => img.url),
  );

  readonly otrasEscuelas = computed(() =>
    this.escuelas()
      .filter((e) => e.id_escuela !== this.idEscuela())
      .map((e) => ({ escuela: e, estilo: estiloDeEscuela(e) })),
  );

  /** Tipos de proyecto presentes en esta escuela (el filtro solo aparece si hay más de uno). */
  readonly tipos = computed(() => [...new Set(this.proyectos().map((p) => p.tipo_proyecto))]);

  readonly proyectosFiltrados = computed(() => {
    const tipo = this.filtroTipo();
    return tipo ? this.proyectos().filter((p) => p.tipo_proyecto === tipo) : this.proyectos();
  });

  constructor() {
    this.portal
      .listarEscuelas()
      .pipe(takeUntilDestroyed())
      .subscribe((escuelas) => {
        this.escuelas.set(escuelas);
        // Escuela inexistente → vuelve al inicio
        if (escuelas.length && !escuelas.some((e) => e.id_escuela === this.idEscuela())) {
          void this.router.navigate(['/']);
        }
      });

    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('idEscuela'))),
        tap((id) => {
          this.idEscuela.set(id);
          this.loading.set(true);
          this.loadError.set(false);
          this.filtroTipo.set(null);
        }),
        switchMap((id) =>
          forkJoin({
            proyectos: this.portal.listarProyectos(id),
            cursos: this.portal.listarCursos(id).pipe(catchError(() => of([] as Curso[]))),
          }).pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((datos) => {
        this.loading.set(false);
        if (!datos) {
          this.loadError.set(true);
          return;
        }
        this.proyectos.set(datos.proyectos);
        this.cursos.set(datos.cursos);
      });
  }

  setFiltroTipo(tipo: string | null): void {
    this.filtroTipo.set(tipo);
  }
}
