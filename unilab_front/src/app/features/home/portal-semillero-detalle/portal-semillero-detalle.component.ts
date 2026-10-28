import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import type { SemilleroPublico } from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

/** HU-3.3 · Portal — detalle público de semillero (portada y galería). */
@Component({
  selector: 'app-portal-semillero-detalle',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ProjectImageCarouselComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './portal-semillero-detalle.component.html',
  styleUrl: './portal-semillero-detalle.component.scss',
})
export class PortalSemilleroDetalleComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);

  readonly semillero = signal<SemilleroPublico | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly estilo = computed(() => estiloDeEscuela(this.semillero()?.escuela));
  readonly imagenesGaleria = computed(() => {
    const s = this.semillero();
    if (!s) return [] as string[];
    const urls = (s.evidencias ?? []).sort((a, b) => a.orden - b.orden).map((e) => e.url);
    if (urls.length) return urls;
    return s.url_foto_portada ? [s.url_foto_portada] : [];
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('idSemillero'))),
        tap(() => {
          this.loading.set(true);
          this.loadError.set(false);
        }),
        switchMap((id) =>
          this.portal.obtenerSemillero(id).pipe(
            tap((semillero) => this.semillero.set(semillero)),
            catchError(() => {
              this.loadError.set(true);
              this.semillero.set(null);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.loading.set(false));
  }

  nombreLider(s: SemilleroPublico): string {
    return `${s.lider.nombres} ${s.lider.apellidos}`.trim();
  }

  volverEscuela(): void {
    const id = this.semillero()?.escuela.id_escuela;
    if (id) {
      void this.router.navigate(['/escuelas', id]);
      return;
    }
    void this.router.navigate(['/'], { fragment: 'semilleros' });
  }
}
