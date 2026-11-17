import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PublicPortalService } from '../public-portal.service';
import type { Escuela, SemilleroPublico } from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { SemilleroCardComponent } from '../semillero-card/semillero-card.component';

const POR_PAGINA = 9;

/**
 * Catálogo público de semilleros: búsqueda, filtro por escuela y «cargar más».
 * Los filtros viven en la URL (?escuela=&q=) para poder compartir el enlace.
 */
@Component({
  selector: 'app-portal-semilleros-explorar',
  standalone: true,
  imports: [RouterLink, TranslatePipe, EmptyStateComponent, SkeletonComponent, SemilleroCardComponent],
  templateUrl: './portal-semilleros-explorar.component.html',
  styleUrl: './portal-semilleros-explorar.component.scss',
})
export class PortalSemillerosExplorarComponent implements OnInit {
  private portal = inject(PublicPortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private readonly busqueda$ = new Subject<string>();

  readonly escuelas = signal<Escuela[]>([]);
  readonly semilleros = signal<SemilleroPublico[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly cargandoMas = signal(false);
  readonly error = signal(false);

  readonly idEscuela = signal<number | null>(null);
  readonly busqueda = signal('');

  readonly hayMas = computed(() => this.pagina() < this.totalPaginas());
  readonly hayFiltros = computed(() => this.idEscuela() !== null || !!this.busqueda().trim());
  readonly escuelaActiva = computed(() => this.escuelas().find((e) => e.id_escuela === this.idEscuela()) ?? null);

  private peticion = 0;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const escuela = Number(q.get('escuela'));
    this.idEscuela.set(Number.isInteger(escuela) && escuela > 0 ? escuela : null);
    this.busqueda.set(q.get('q') ?? '');

    this.portal.listarEscuelas().subscribe({ next: (data) => this.escuelas.set(data) });

    this.busqueda$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargar());

    this.cargar(1);
  }

  colorEscuela(e: Escuela): string {
    return estiloDeEscuela(e).color;
  }

  iconoEscuela(e: Escuela): string {
    return estiloDeEscuela(e).icono;
  }

  onBuscar(valor: string): void {
    this.busqueda.set(valor);
    this.busqueda$.next(valor.trim());
  }

  elegirEscuela(id: number | null): void {
    if (this.idEscuela() === id) return;
    this.idEscuela.set(id);
    this.recargar();
  }

  limpiar(): void {
    this.busqueda.set('');
    this.idEscuela.set(null);
    this.busqueda$.next('');
    this.recargar();
  }

  cargarMas(): void {
    if (!this.hayMas() || this.cargandoMas()) return;
    this.cargar(this.pagina() + 1);
  }

  reintentar(): void {
    this.recargar();
  }

  private recargar(): void {
    this.sincronizarUrl();
    this.cargar(1);
  }

  private cargar(pagina: number): void {
    const id = ++this.peticion;
    const agregar = pagina > 1;
    (agregar ? this.cargandoMas : this.cargando).set(true);
    this.error.set(false);

    this.portal
      .listarSemilleros({
        idEscuela: this.idEscuela() ?? undefined,
        busqueda: this.busqueda(),
        pagina,
        limite: POR_PAGINA,
      })
      .subscribe({
        next: (resp) => {
          // Descarta respuestas de filtros anteriores que lleguen tarde.
          if (id !== this.peticion) return;
          this.semilleros.set(agregar ? [...this.semilleros(), ...resp.data] : resp.data);
          this.total.set(resp.paginacion.total);
          this.pagina.set(resp.paginacion.pagina);
          this.totalPaginas.set(resp.paginacion.total_paginas);
          this.cargando.set(false);
          this.cargandoMas.set(false);
        },
        error: () => {
          if (id !== this.peticion) return;
          this.error.set(true);
          this.cargando.set(false);
          this.cargandoMas.set(false);
        },
      });
  }

  private sincronizarUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { escuela: this.idEscuela() ?? null, q: this.busqueda().trim() || null },
      replaceUrl: true,
    });
  }
}
