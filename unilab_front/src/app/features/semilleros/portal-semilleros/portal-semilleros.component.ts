import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { SemillerosService } from '../semilleros.service';
import { ConfiguracionService } from '../../configuracion/configuracion.service';
import type { Semillero, SemilleroMiembro } from '../../../core/models/semillero.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

interface SemilleroPortal {
  semillero: Semillero;
  membresia: SemilleroMiembro | null;
  miembros: number;
}

/** RF-015 · Semilleros en el portal del estudiante: consulta y solicitud de ingreso. */
@Component({
  selector: 'app-portal-semilleros',
  standalone: true,
  imports: [TranslatePipe, EmptyStateComponent, SkeletonComponent],
  templateUrl: './portal-semilleros.component.html',
  styleUrl: './portal-semilleros.component.scss',
})
export class PortalSemillerosComponent implements OnInit {
  private semillerosService = inject(SemillerosService);
  private configuracion = inject(ConfiguracionService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly semilleros = signal<Semillero[]>([]);
  readonly solicitudesAbiertas = signal(true);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviandoId = signal<number | null>(null);
  private readonly idUsuario = this.auth.getCurrentUser()?.id_usuario;

  /** Primero aquellos en los que el estudiante ya participa; los inactivos no se muestran. */
  readonly items = computed<SemilleroPortal[]>(() =>
    this.semilleros()
      .filter((s) => s.activo)
      .map((semillero) => ({
        semillero,
        membresia: semillero.miembros.find((m) => m.id_estudiante === this.idUsuario) ?? null,
        miembros: semillero.miembros.filter((m) => m.estado_solicitud === 'aprobado').length,
      }))
      .sort((a, b) => Number(!!b.membresia) - Number(!!a.membresia)),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      semilleros: this.semillerosService.listar(),
      config: this.configuracion.publica(),
    }).subscribe({
      next: ({ semilleros, config }) => {
        this.semilleros.set(semilleros);
        this.solicitudesAbiertas.set(config.semilleros_solicitudes_abiertas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('semilleros.errorCargar');
        this.cargando.set(false);
      },
    });
  }

  puedeSolicitar(item: SemilleroPortal): boolean {
    return (
      this.solicitudesAbiertas() &&
      (!item.membresia || item.membresia.estado_solicitud === 'rechazado')
    );
  }

  solicitar(item: SemilleroPortal): void {
    const id = item.semillero.id_semillero;
    this.enviandoId.set(id);
    this.semillerosService.solicitarIngreso(id).subscribe({
      next: (membresia) => {
        this.enviandoId.set(null);
        this.toast.success('semilleros.portal.exitoSolicitud');
        // Refleja la solicitud sin recargar toda la lista.
        this.semilleros.update((lista) =>
          lista.map((s) =>
            s.id_semillero === id
              ? {
                  ...s,
                  miembros: [
                    ...s.miembros.filter((m) => m.id_estudiante !== this.idUsuario),
                    membresia,
                  ],
                }
              : s,
          ),
        );
      },
      error: (err: { message?: string }) => {
        this.enviandoId.set(null);
        this.toast.error(err?.message ?? 'semilleros.portal.errorSolicitud');
      },
    });
  }

  nombreLider(s: Semillero): string {
    return s.profesor_lider ? `${s.profesor_lider.nombres} ${s.profesor_lider.apellidos}` : '—';
  }
}
