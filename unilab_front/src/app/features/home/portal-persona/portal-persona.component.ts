import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PerfilService } from '../../perfil/perfil.service';
import type { PerfilPublico } from '../../../core/models/usuario.model';
import { RedesContactoComponent } from '../../../shared/ui/redes-contacto/redes-contacto.component';
import { ProyectoCardComponent } from '../proyecto-card/proyecto-card.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { RevealDirective } from '../../../shared/ui/reveal/reveal.directive';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { formatearRangoFechas } from '../../../core/utils/date.util';

/**
 * Portal — perfil público de una persona (tipo CvLAC): lo que escribe (titular, biografía,
 * enlaces, formación) y lo que la plataforma registra (escuela, semilleros, proyectos publicados
 * y eventos asistidos). Se llega desde los integrantes y directores de cada proyecto.
 */
@Component({
  selector: 'app-portal-persona',
  standalone: true,
  imports: [RouterLink, TranslatePipe, RedesContactoComponent, ProyectoCardComponent, EmptyStateComponent, SkeletonComponent, RevealDirective, AvatarComponent],
  templateUrl: './portal-persona.component.html',
  styleUrl: './portal-persona.component.scss',
})
export class PortalPersonaComponent {
  private route = inject(ActivatedRoute);
  private perfilService = inject(PerfilService);

  readonly perfil = signal<PerfilPublico | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);
  /** Se muestran 6 proyectos y el resto bajo «Ver todos». */
  readonly verTodosProyectos = signal(false);
  readonly proyectosVisibles = computed(() => {
    const lista = this.perfil()?.proyectos ?? [];
    return this.verTodosProyectos() ? lista : lista.slice(0, 6);
  });

  readonly nombre = computed(() => {
    const p = this.perfil();
    return p ? `${p.nombres} ${p.apellidos}`.trim() : '';
  });

  readonly iniciales = computed(() => {
    const p = this.perfil();
    return `${p?.nombres?.charAt(0) ?? ''}${p?.apellidos?.charAt(0) ?? ''}`.toUpperCase() || '?';
  });

  /** Datos del rol que no son la escuela (cargo del coordinador, institución del externo...). */
  readonly datosRol = computed(() => {
    const p = this.perfil();
    if (!p) return [];
    return [
      { clave: 'usuarios.cargo', valor: p.cargo },
      { clave: 'usuarios.dependencia', valor: p.dependencia },
      { clave: 'perfil.profesion', valor: p.profesion },
      { clave: 'usuarios.institucion', valor: p.institucion },
      { clave: 'usuarios.ocupacion', valor: p.ocupacion },
    ].filter((d) => !!d.valor);
  });

  readonly sinContenidoPropio = computed(() => {
    const p = this.perfil();
    return !!p && !p.titular && !p.biografia && p.especialidades.length === 0 && p.fortalezas.length === 0;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('idUsuario'))),
        tap(() => {
          this.cargando.set(true);
          this.error.set(false);
          this.verTodosProyectos.set(false);
        }),
        switchMap((id) => this.perfilService.perfilPublico(id).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((perfil) => {
        this.cargando.set(false);
        this.perfil.set(perfil);
        this.error.set(!perfil);
      });
  }

  rangoEvento(inicio: string, fin: string): string {
    return formatearRangoFechas(inicio, fin);
  }

  periodo(inicio: number | null, fin: number | null): string {
    if (!inicio && !fin) return '';
    return `${inicio ?? '—'} – ${fin ?? ''}`.trim();
  }
}
