import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getDefaultRouteForRole } from '../../../core/config/role-redirect';
import { AuthModalService } from '../auth-modal.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { SpiderwebCanvasComponent } from '../spiderweb-canvas/spiderweb-canvas.component';

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslatePipe, AuthModalComponent, SpiderwebCanvasComponent],
  templateUrl: './portal-shell.component.html',
  styleUrl: './portal-shell.component.scss',
})
export class PortalShellComponent {
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  private router = inject(Router);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly showAuthModal = computed(() => this.authModal.visible());

  onAuthClick(): void {
    if (this.isLoggedIn()) {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.router.navigate([getDefaultRouteForRole(user.id_rol)]);
      }
      return;
    }
    this.authModal.open();
  }
}
