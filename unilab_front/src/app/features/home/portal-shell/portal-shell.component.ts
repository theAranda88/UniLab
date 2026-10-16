import { Component, effect, inject, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getShellPrefix } from '../../../core/config/role-redirect';
import { PortalProfileMenuComponent } from '../portal-profile-menu/portal-profile-menu.component';
import { ConfiguracionService } from '../../configuracion/configuracion.service';
import { PortalSeccionService } from '../portal-seccion.service';
import { ViewportScroller } from '@angular/common';

type PortalSection = 'inicio' | 'proyectos' | 'eventos' | 'mis-proyectos' | 'semilleros' | null;

/** Shell del portal público Eduinova: cabecera, contenido y pie (estático). */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, PortalProfileMenuComponent],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
  host: { '(document:keydown.escape)': 'menuAbierto.set(false)' },
})
export class PortalShellComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private seccionSvc = inject(PortalSeccionService);
  private scroller = inject(ViewportScroller);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly isPortalStudent = computed(() => this.auth.hasAnyRole(['Estudiante', 'Externo']));
  readonly isEstudiante = computed(() => this.auth.hasRole('Estudiante'));

  /** Aviso global configurado por el administrador (RA-013); vacío = sin aviso. */
  readonly mensajePortal = toSignal(
    inject(ConfiguracionService)
      .publica()
      .pipe(map((config) => config.mensaje_portal.trim())),
    { initialValue: '' },
  );

  readonly staffPanelRoute = computed(() => {
    if (!this.isLoggedIn() || this.isPortalStudent()) return null;
    const prefix = getShellPrefix(this.auth.currentRole() ?? '');
    return prefix ? `${prefix}/dashboard` : null;
  });

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0]),
      startWith(this.router.url.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );

  /** Sección activa de la navegación del portal. */
  readonly activeSection = computed<PortalSection>(() => {
    const path = this.currentPath() || '/';
    // En el inicio, la opción activa es la sección que se está viendo (la publica el inicio)
    if (path === '/') return this.seccionSvc.seccion() ?? 'inicio';
    if (path.startsWith('/escuelas') || path.startsWith('/proyectos')) return 'proyectos';
    if (path.startsWith('/eventos')) return 'eventos';
    if (path.startsWith('/mis-proyectos')) return 'mis-proyectos';
    if (path.startsWith('/semilleros')) return 'semilleros';
    return null;
  });

  /** Menú desplegable en pantallas estrechas. */
  readonly menuAbierto = signal(false);

  constructor() {
    // Cualquier navegación (enlace del menú, atrás, etc.) cierra el menú móvil.
    effect(() => {
      this.currentPath();
      this.menuAbierto.set(false);
    });
  }

  toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** Un enlace a la misma ruta (p. ej. «/#escuelas» desde el inicio) no cambia la URL base. */
  cerrarSiEnlace(event: Event): void {
    if ((event.target as HTMLElement | null)?.closest('a')) this.menuAbierto.set(false);
  }

  /**
   * Estando ya en el inicio, el router ignora un enlace a la misma URL (p. ej. volver a pulsar
   * «Proyectos» tras desplazarse). En ese caso se desplaza explícitamente a la sección.
   */
  irASeccion(ancla: string | null): void {
    if ((this.currentPath() || '/') !== '/') return;
    setTimeout(() => {
      if (ancla) this.scroller.scrollToAnchor(ancla);
      else this.scroller.scrollToPosition([0, 0]);
    });
  }
}
