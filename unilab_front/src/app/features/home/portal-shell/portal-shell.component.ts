import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getShellPrefix } from '../../../core/config/role-redirect';
import { AuthModalService } from '../auth-modal.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { PortalProfileMenuComponent } from '../portal-profile-menu/portal-profile-menu.component';
import { SpiderwebCanvasComponent } from '../spiderweb-canvas/spiderweb-canvas.component';

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    TranslatePipe,
    AuthModalComponent,
    PortalProfileMenuComponent,
    SpiderwebCanvasComponent,
  ],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
})
export class PortalShellComponent {
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  private router = inject(Router);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly showAuthModal = computed(() => this.authModal.visible());
  readonly isPortalStudent = computed(() =>
    this.auth.hasAnyRole(['Estudiante', 'Externo']),
  );

  readonly staffPanelRoute = computed(() => {
    if (!this.isLoggedIn() || this.isPortalStudent()) return null;
    const prefix = getShellPrefix(this.auth.currentRole() ?? '');
    return prefix ? `${prefix}/dashboard` : null;
  });

  readonly showStudentNav = computed(() => this.isLoggedIn() && this.isPortalStudent());

  readonly logoError = signal(false);
  readonly headerLogoVisible = signal(false);

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  readonly showHeaderLogo = computed(() => {
    const path = this.currentPath() ?? '';
    return /^\/escuelas\/\d+/.test(path) || /^\/proyectos\/\d+/.test(path);
  });

  constructor() {
    effect(() => {
      if (this.showHeaderLogo()) {
        this.headerLogoVisible.set(false);
        window.setTimeout(() => this.headerLogoVisible.set(true), 120);
      } else {
        this.headerLogoVisible.set(false);
      }
    });
  }

  onAuthClick(): void {
    this.authModal.open();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
