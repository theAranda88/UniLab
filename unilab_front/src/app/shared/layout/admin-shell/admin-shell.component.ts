import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import {
  NAV_BY_ROLE,
  SHELL_CTA_BY_ROLE,
  SHELL_SUBTITLE_BY_ROLE,
  ShellRole,
} from '../../../core/config/nav-by-role';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterModule, RouterOutlet, TranslatePipe],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  shellRole = signal<ShellRole>('Administrador');
  shellPrefix = signal('/admin');
  currentPath = signal('');

  usuario = computed(() => this.authService.getCurrentUser());
  iniciales = computed(() => {
    const rol = this.shellRole();
    const map: Record<ShellRole, string> = {
      Administrador: 'AD',
      Coordinador: 'CO',
      Profesor: 'PR',
    };
    return map[rol];
  });

  navSections = computed(() => NAV_BY_ROLE[this.shellRole()]);
  ctaKey = computed(() => SHELL_CTA_BY_ROLE[this.shellRole()]);
  roleSubKey = computed(() => SHELL_SUBTITLE_BY_ROLE[this.shellRole()]);

  pageTitleKey = computed(() => {
    const path = this.currentPath();
    if (path.includes('/escuelas')) return 'shell.pages.escuelas';
    if (path.includes('/eventos')) return 'shell.pages.eventos';
    if (path.includes('/dashboard')) {
      return this.shellRole() === 'Profesor' ? 'shell.pages.miPanel' : 'shell.pages.dashboard';
    }
    return 'shell.pages.dashboard';
  });

  constructor() {
    this.currentPath.set(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.currentPath.set(this.router.url));
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['shellRole']) {
      this.shellRole.set(data['shellRole'] as ShellRole);
    }
    if (data['shellPrefix']) {
      this.shellPrefix.set(data['shellPrefix'] as string);
    }
  }

  isActive(route: string): boolean {
    const prefix = this.shellPrefix();
    const path = this.currentPath();
    if (route === 'dashboard') {
      return path === `${prefix}/dashboard` || path === `${prefix}`;
    }
    return path.startsWith(`${prefix}/${route}`);
  }

  navTo(route: string, enabled: boolean): void {
    if (!enabled) return;
    this.router.navigate([this.shellPrefix(), route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
