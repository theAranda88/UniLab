import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { EscuelasService } from '../escuelas.service';
import { PublicPortalService } from '../../home/public-portal.service';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';
import type { Curso } from '../../../core/models/portal.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

interface EscuelaCard {
  escuela: EscuelaAdmin;
  cursos: string[];
  proyectos: number;
}

/** Pantalla 09 · Escuelas — tarjetas con sus cursos y proyectos publicados. */
@Component({
  selector: 'app-escuelas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './escuelas-list.component.html',
  styleUrl: './escuelas-list.component.scss',
})
export class EscuelasListComponent implements OnInit {
  private escuelasService = inject(EscuelasService);
  private portal = inject(PublicPortalService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly cursosPorEscuela = signal<Record<number, Curso[]>>({});
  readonly proyectosPorEscuela = signal<Record<number, number>>({});
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  readonly puedeGestionar = this.escuelasService.puedeGestionar();

  readonly cards = computed<EscuelaCard[]>(() =>
    this.escuelas().map((escuela) => ({
      escuela,
      cursos: (this.cursosPorEscuela()[escuela.id_escuela] ?? []).map((c) => c.nombre_curso),
      proyectos: this.proyectosPorEscuela()[escuela.id_escuela] ?? 0,
    })),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.escuelasService.listar().subscribe({
      next: (data) => {
        this.escuelas.set(data);
        this.cargando.set(false);
        this.cargarDetalle(data);
      },
      error: () => {
        this.error.set('escuelas.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.router.navigate([this.escuelasService.getBasePath(), 'crear']);
  }

  editar(id: number): void {
    this.router.navigate([this.escuelasService.getBasePath(), id, 'editar']);
  }

  async eliminar(escuela: EscuelaAdmin): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'escuelas.eliminarTitulo',
      message: this.translate.instant('escuelas.eliminarMensaje', {
        nombre: escuela.nombre_escuela,
      }),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoId.set(escuela.id_escuela);
    this.escuelasService.eliminar(escuela.id_escuela).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.toast.success('escuelas.exitoEliminar');
        this.cargar();
      },
      error: () => {
        this.eliminandoId.set(null);
        this.error.set('escuelas.errorEliminar');
      },
    });
  }

  trackById(_: number, item: EscuelaCard): number {
    return item.escuela.id_escuela;
  }

  /** Cursos y proyectos publicados salen de la API pública (no bloquean la lista). */
  private cargarDetalle(escuelas: EscuelaAdmin[]): void {
    this.portal.listarEscuelas().subscribe({
      next: (publicas) =>
        this.proyectosPorEscuela.set(
          Object.fromEntries(publicas.map((e) => [e.id_escuela, e.total_proyectos_publicados ?? 0])),
        ),
    });
    if (escuelas.length === 0) return;
    forkJoin(
      escuelas.map((e) =>
        this.portal.listarCursos(e.id_escuela).pipe(
          map((cursos) => [e.id_escuela, cursos] as const),
          catchError(() => of([e.id_escuela, [] as Curso[]] as const)),
        ),
      ),
    ).subscribe((pares) => this.cursosPorEscuela.set(Object.fromEntries(pares)));
  }
}
