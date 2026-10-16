import { Component, HostListener, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ShellNotificationsService, type ShellNotification } from './shell-notifications.service';
import {
  NAV_BY_ROLE,
  SHELL_CTA_BY_ROLE,
  SHELL_SUBTITLE_BY_ROLE,
  ShellRole,
  type NavItem,
  type NavSection,
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
  private i18n = inject(I18nService);
  private notificationsService = inject(ShellNotificationsService);

  shellRole = signal<ShellRole>('Administrador');
  shellPrefix = signal('/admin');
  currentPath = signal('');

  /** Cajón lateral en móvil (< 768px). */
  readonly drawerOpen = signal(false);
  /** Menú desplegable abierto en el topbar. */
  readonly openMenu = signal<'notificaciones' | 'ajustes' | null>(null);
  readonly notifications = signal<ShellNotification[]>([]);
  readonly cargandoNotificaciones = signal(false);
  readonly idiomas = this.i18n.getSupportedLanguages();
  readonly idiomaActual = signal(this.i18n.getCurrentLanguage());

  usuario = computed(() => this.authService.getCurrentUser());
  /** Nombre real del usuario (o su correo si el perfil no trae nombre). */
  nombreUsuario = computed(() => {
    const u = this.usuario();
    const nombre = [u?.nombres, u?.apellidos].filter(Boolean).join(' ').trim();
    return nombre || u?.email || this.shellRole();
  });
  iniciales = computed(() => {
    const partes = this.nombreUsuario().split(/[\s@.]+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'U';
  });

  /** Grupo desplegado de la barra lateral (acordeón: uno a la vez). */
  readonly grupoAbierto = signal<string | null>(null);

  navSections = computed(() => NAV_BY_ROLE[this.shellRole()]);
  ctaKey = computed(() => SHELL_CTA_BY_ROLE[this.shellRole()]);
  roleSubKey = computed(() => SHELL_SUBTITLE_BY_ROLE[this.shellRole()]);

  /** Ítem del menú que corresponde a la URL actual (el de ruta más larga que coincide). */
  readonly itemActivo = computed<{ seccion: NavSection; item: NavItem } | null>(() => {
    let mejor: { seccion: NavSection; item: NavItem } | null = null;
    for (const seccion of this.navSections()) {
      for (const item of seccion.items) {
        if (item.enabled && this.isActive(item.route) && (!mejor || item.route.length > mejor.item.route.length)) {
          mejor = { seccion, item };
        }
      }
    }
    return mejor;
  });

  /** Título de la cabecera: la opción del menú activa (p. ej. «Proyectos asignados»). */
  readonly tituloKey = computed(
    () =>
      this.itemActivo()?.item.labelKey ??
      (this.shellRole() === 'Profesor' ? 'shell.pages.miPanel' : 'shell.pages.dashboard'),
  );

  constructor() {
    this.currentPath.set(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.currentPath.set(this.router.url);
        this.drawerOpen.set(false);
        this.openMenu.set(null);
        this.abrirGrupoActivo();
      });
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['shellRole']) {
      this.shellRole.set(data['shellRole'] as ShellRole);
    }
    if (data['shellPrefix']) {
      this.shellPrefix.set(data['shellPrefix'] as string);
    }
    this.cargarNotificaciones();
    this.abrirGrupoActivo();
  }

  /** Despliega el grupo que contiene la página actual. */
  private abrirGrupoActivo(): void {
    const activo = this.itemActivo();
    if (activo) this.grupoAbierto.set(activo.seccion.sectionKey);
  }

  toggleGrupo(sectionKey: string): void {
    this.grupoAbierto.update((actual) => (actual === sectionKey ? null : sectionKey));
  }

  /** El grupo contiene la página actual (se resalta aunque esté plegado). */
  grupoActivo(seccion: NavSection): boolean {
    return this.itemActivo()?.seccion.sectionKey === seccion.sectionKey;
  }

  cargarNotificaciones(): void {
    this.cargandoNotificaciones.set(true);
    this.notificationsService.load(this.shellRole(), this.shellPrefix()).subscribe((items) => {
      this.notifications.set(items);
      this.cargandoNotificaciones.set(false);
    });
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  toggleMenu(menu: 'notificaciones' | 'ajustes'): void {
    this.openMenu.update((actual) => (actual === menu ? null : menu));
  }

  abrirNotificacion(item: ShellNotification): void {
    this.openMenu.set(null);
    this.router.navigate(item.route);
  }

  cambiarIdioma(idioma: string): void {
    this.i18n.setLanguage(idioma);
    this.idiomaActual.set(idioma);
    this.openMenu.set(null);
  }

  /** Cierra menús y cajón al hacer clic fuera o pulsar Escape. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.openMenu() && !target?.closest('.tb-menu')) {
      this.openMenu.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenu.set(null);
    this.drawerOpen.set(false);
  }

  isActive(route: string): boolean {
    const prefix = this.shellPrefix();
    const path = this.currentPath();
    if (route === 'dashboard') {
      return path === `${prefix}/dashboard` || path === `${prefix}`;
    }
    return path.startsWith(`${prefix}/${route}`);
  }


  crearUsuario(): void {
    if (this.shellRole() !== 'Administrador') return;
    this.router.navigate([this.shellPrefix(), 'usuarios', 'crear']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
