import { Component, inject, computed } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getShellPrefix } from '../../../core/config/role-redirect';
import { PortalProfileMenuComponent } from '../portal-profile-menu/portal-profile-menu.component';

type PortalSection = 'inicio' | 'proyectos' | 'eventos' | 'mis-proyectos' | null;

/** Shell del portal público Eduinova: cabecera, contenido y pie (estático). */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, PortalProfileMenuComponent],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
})
export class PortalShellComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly isPortalStudent = computed(() => this.auth.hasAnyRole(['Estudiante', 'Externo']));
  readonly isEstudiante = computed(() => this.auth.hasRole('Estudiante'));

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
    if (path === '/') return 'inicio';
    if (path.startsWith('/escuelas') || path.startsWith('/proyectos')) return 'proyectos';
    if (path.startsWith('/eventos')) return 'eventos';
    if (path.startsWith('/mis-proyectos')) return 'mis-proyectos';
    return null;
  });
}
