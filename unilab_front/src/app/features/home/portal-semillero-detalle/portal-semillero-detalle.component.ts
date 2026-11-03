import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import type { SemilleroPublico, ProyectoPublico } from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';
import { normalizarUrlUploadPublica } from '../../../core/models/portal.model';
import { AuthService } from '../../../core/auth/auth.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ImageLightboxComponent } from '../../../shared/ui/image-lightbox/image-lightbox.component';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';

/** Miniaturas visibles antes de «ver todas»: 1 grande + 4 pequeñas llenan la cuadrícula. */
const MINIATURAS = 5;

/**
 * HU-3.3 · Portal — detalle público de semillero.
 * Portada destacada, indicadores, proyectos (con filtro por tipo), galería con visor y «Acerca».
 */
@Component({
  selector: 'app-portal-semillero-detalle',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    EmptyStateComponent,
    SkeletonComponent,
    ImageLightboxComponent,
    ProyectoCardComponent,
  ],
  templateUrl: './portal-semillero-detalle.component.html',
  styleUrl: './portal-semillero-detalle.component.scss',
})
export class PortalSemilleroDetalleComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);
  private auth = inject(AuthService);

  readonly semillero = signal<SemilleroPublico | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly tipoFiltro = signal<string | null>(null);
  readonly visor = signal<number | null>(null);
  readonly verTodas = signal(false);

  readonly estilo = computed(() => estiloDeEscuela(this.semillero()?.escuela));

  /** Fotos de actividades (evidencias), en orden. */
  readonly evidencias = computed(() =>
    [...(this.semillero()?.evidencias ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((e) => normalizarUrlUploadPublica(e.url)),
  );

  /** Portada; si no hay, la primera evidencia. */
  readonly imagenHero = computed(() => {
    const s = this.semillero();
    return normalizarUrlUploadPublica(s?.url_foto_portada) || this.evidencias()[0] || '';
  });

  readonly miniaturas = computed(() =>
    this.verTodas() ? this.evidencias() : this.evidencias().slice(0, MINIATURAS),
  );
  readonly ocultas = computed(() => Math.max(0, this.evidencias().length - MINIATURAS));

  readonly proyectos = computed((): ProyectoPublico[] => this.semillero()?.proyectos ?? []);

  /** Tipos presentes en los proyectos, con su cantidad (para los filtros). */
  readonly tipos = computed(() => {
    const conteo = new Map<string, number>();
    for (const p of this.proyectos()) conteo.set(p.tipo_proyecto, (conteo.get(p.tipo_proyecto) ?? 0) + 1);
    return [...conteo.entries()].map(([tipo, total]) => ({ tipo, total }));
  });

  readonly proyectosFiltrados = computed(() => {
    const tipo = this.tipoFiltro();
    return tipo ? this.proyectos().filter((p) => p.tipo_proyecto === tipo) : this.proyectos();
  });

  /** Integrantes de los proyectos publicados del semillero (autores únicos). */
  readonly autores = computed(() => {
    const nombres = new Set<string>();
    for (const p of this.proyectos()) {
      for (const a of p.autores ?? []) {
        nombres.add(`${a.estudiante.nombres} ${a.estudiante.apellidos}`.trim());
      }
      if (p.estudiante_creador) {
        nombres.add(`${p.estudiante_creador.nombres} ${p.estudiante_creador.apellidos}`.trim());
      }
    }
    return [...nombres].filter(Boolean).sort((a, b) => a.localeCompare(b));
  });

  /** Destino del botón «Quiero participar» según la sesión. */
  readonly participar = computed<{ ruta: string; query?: Record<string, string> } | null>(() => {
    const rol = this.auth.user()?.id_rol;
    if (!rol) return { ruta: '/login', query: { returnUrl: this.router.url } };
    if (rol === 'Estudiante') return { ruta: '/semilleros' };
    return null;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('idSemillero'))),
        tap(() => {
          this.loading.set(true);
          this.loadError.set(false);
          this.tipoFiltro.set(null);
          this.verTodas.set(false);
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

  inicialesLider(s: SemilleroPublico): string {
    return `${s.lider.nombres?.charAt(0) ?? ''}${s.lider.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  }

  elegirTipo(tipo: string | null): void {
    this.tipoFiltro.set(this.tipoFiltro() === tipo ? null : tipo);
  }

  irA(seccion: string): void {
    document.getElementById(seccion)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  abrirVisor(indice: number): void {
    this.visor.set(indice);
  }

  volverEscuela(): void {
    const id = this.semillero()?.escuela.id_escuela;
    if (id) {
      void this.router.navigate(['/escuelas', id]);
      return;
    }
    void this.router.navigate(['/semilleros/explorar']);
  }
}
