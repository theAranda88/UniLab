import { Component, ElementRef, HostListener, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { getShellPrefix } from '../../../core/config/role-redirect';

@Component({
  selector: 'app-portal-profile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './portal-profile-menu.component.html',
  styleUrl: './portal-profile-menu.component.scss',
})
export class PortalProfileMenuComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef);

  readonly open = signal(false);

  readonly user = computed(() => this.auth.getCurrentUser());

  readonly iniciales = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const n = u.nombres?.trim().charAt(0) ?? '';
    const a = u.apellidos?.trim().charAt(0) ?? '';
    const fromEmail = u.email?.charAt(0) ?? '';
    const letters = (n + a).toUpperCase();
    return letters || fromEmail.toUpperCase() || '?';
  });

  readonly nombreCompleto = computed(() => {
    const u = this.user();
    if (!u) return '';
    const full = `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim();
    return full || u.email;
  });

  /** Nombre corto que se muestra junto al avatar. */
  readonly nombreCorto = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.nombres?.trim().split(/\s+/)[0] || u.email.split('@')[0];
  });

  /** Panel propio según el rol: dashboard para staff, «Mis proyectos» para Estudiante. */
  readonly panelRoute = computed<string | null>(() => {
    const rol = this.user()?.id_rol ?? '';
    const prefix = getShellPrefix(rol);
    if (prefix) return `${prefix}/dashboard`;
    if (rol === 'Estudiante') return '/mis-proyectos';
    return null;
  });

  readonly rolKey = computed(() => {
    const rol = this.user()?.id_rol;
    if (!rol) return 'home.profileMenu.role';
    return `roles.${rol}`;
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  logout(): void {
    this.close();
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
