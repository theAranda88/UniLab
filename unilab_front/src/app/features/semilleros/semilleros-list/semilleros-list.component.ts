import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SemillerosService } from '../semilleros.service';
import type { Semillero } from '../../../core/models/semillero.model';
import { AuthService } from '../../../core/auth/auth.service';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

interface SemilleroCard {
  semillero: Semillero;
  miembros: number;
  pendientes: number;
  esLider: boolean;
}

/**
 * RF-015 / RA-010 · Semilleros en el panel.
 * Administrador: gestiona todos. Coordinador: consulta. Profesor: solo los suyos (líder o asignado).
 */
@Component({
  selector: 'app-semilleros-list',
  standalone: true,
  imports: [RouterLink, TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './semilleros-list.component.html',
  styleUrl: './semilleros-list.component.scss',
})
export class SemillerosListComponent implements OnInit {
  private semillerosService = inject(SemillerosService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  readonly semilleros = signal<Semillero[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  readonly esAdmin = this.auth.hasRole('Administrador');
  readonly esProfesor = this.auth.hasRole('Profesor');
  readonly basePath = this.semillerosService.getBasePath();
  private readonly idUsuario = this.auth.getCurrentUser()?.id_usuario;

  readonly cards = computed<SemilleroCard[]>(() =>
    this.semilleros()
      .filter((s) => !this.esProfesor || this.participa(s))
      .map((semillero) => ({
        semillero,
        miembros: semillero.miembros.filter((m) => m.estado_solicitud === 'aprobado').length,
        pendientes: semillero.miembros.filter((m) => m.estado_solicitud === 'pendiente').length,
        esLider: semillero.id_profesor_lider === this.idUsuario,
      })),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.semillerosService.listar().subscribe({
      next: (data) => {
        this.semilleros.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('semilleros.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.router.navigate([this.basePath, 'crear']);
  }

  editar(id: number): void {
    this.router.navigate([this.basePath, id, 'editar']);
  }

  async eliminar(semillero: Semillero): Promise<void> {
    const ok = await this.dialog.confirm({
      titleKey: 'semilleros.eliminarTitulo',
      message: this.translate.instant('semilleros.eliminarMensaje', {
        nombre: semillero.nombre_semillero,
      }),
      confirmKey: 'common.eliminar',
      cancelKey: 'common.cancelar',
      destructive: true,
    });
    if (!ok) return;

    this.eliminandoId.set(semillero.id_semillero);
    this.semillerosService.eliminar(semillero.id_semillero).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.semilleros.update((lista) =>
          lista.filter((s) => s.id_semillero !== semillero.id_semillero),
        );
        this.toast.success('semilleros.exitoEliminar');
      },
      error: (err: { message?: string }) => {
        this.eliminandoId.set(null);
        this.toast.error(err?.message ?? 'semilleros.errorEliminar');
      },
    });
  }

  nombreLider(s: Semillero): string {
    return s.profesor_lider ? `${s.profesor_lider.nombres} ${s.profesor_lider.apellidos}` : '—';
  }

  private participa(s: Semillero): boolean {
    return (
      s.id_profesor_lider === this.idUsuario ||
      s.profesores.some((p) => p.id_profesor === this.idUsuario)
    );
  }
}
