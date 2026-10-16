import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CursosService } from '../cursos.service';
import { EscuelasService } from '../../escuelas/escuelas.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Curso } from '../../../core/models/portal.model';
import type { EscuelaAdmin } from '../../../core/models/escuela.model';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

/** RA-003 · Cursos — listado filtrable por escuela. Gestiona el Administrador; el Profesor lo consulta. */
@Component({
  selector: 'app-cursos-list',
  standalone: true,
  imports: [TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './cursos-list.component.html',
  styleUrl: './cursos-list.component.scss',
})
export class CursosListComponent implements OnInit {
  private cursosService = inject(CursosService);
  private escuelasService = inject(EscuelasService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  /** Crear, editar y eliminar es solo del Administrador (así lo exige también la API). */
  readonly puedeGestionar = inject(AuthService).hasRole('Administrador');

  readonly cursos = signal<Curso[]>([]);
  readonly escuelas = signal<EscuelaAdmin[]>([]);
  readonly filtroEscuela = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  readonly filtrados = computed(() => {
    const id = this.filtroEscuela();
    return id === null ? this.cursos() : this.cursos().filter((c) => c.id_escuela === id);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      cursos: this.cursosService.listar(),
      escuelas: this.escuelasService.listar(),
    }).subscribe({
      next: ({ cursos, escuelas }) => {
        this.cursos.set(cursos);
        this.escuelas.set(escuelas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('cursos.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  setFiltroEscuela(id: number | null): void {
    this.filtroEscuela.set(id);
  }

  crear(): void {
    const id = this.filtroEscuela();
    this.router.navigate(
      ['/admin/cursos/crear'],
      id ? { queryParams: { escuela: id } } : undefined,
    );
  }

  editar(id: number): void {
    this.router.navigate(['/admin/cursos', id, 'editar']);
  }

  async eliminar(curso: Curso): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'cursos.eliminarTitulo',
      message: this.translate.instant('cursos.eliminarMensaje', { nombre: curso.nombre_curso }),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoId.set(curso.id_curso);
    this.cursosService.eliminar(curso.id_curso).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cursos.update((lista) => lista.filter((c) => c.id_curso !== curso.id_curso));
        this.toast.success('cursos.exitoEliminar');
      },
      error: (err: { message?: string }) => {
        this.eliminandoId.set(null);
        // El backend explica el motivo (p. ej. el curso tiene proyectos asociados).
        this.toast.error(err?.message ?? 'cursos.errorEliminar');
      },
    });
  }
}
