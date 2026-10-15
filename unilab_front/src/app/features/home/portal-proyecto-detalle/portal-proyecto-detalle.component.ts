import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PublicPortalService } from '../public-portal.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import { urlsImagenesProyecto, type ProyectoPublico } from '../../../core/models/portal.model';

import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-portal-proyecto-detalle',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ProjectImageCarouselComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './portal-proyecto-detalle.component.html',
  styleUrl: './portal-proyecto-detalle.component.scss',
})
export class PortalProyectoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

  readonly proyecto = signal<ProyectoPublico | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly escuelaId = computed(() => this.proyecto()?.curso?.id_escuela ?? null);
  readonly imagenes = computed(() => {
    const p = this.proyecto();
    return p ? urlsImagenesProyecto(p) : [];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('idProyecto'));
    this.portal.obtenerProyecto(id).subscribe({
      next: (data) => {
        this.proyecto.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onProtectedAction(url: string | null | undefined): void {
    if (!url) return;
    if (this.isLoggedIn()) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    this.irALogin();
  }

  onRequireAuth(): void {
    if (!this.isLoggedIn()) this.irALogin();
  }

  /** Sin sesión: va a /login y vuelve a esta ficha al autenticarse. */
  private irALogin(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  goBack(): void {
    const eid = this.escuelaId();
    if (!eid) return;
    void this.router.navigate(['/escuelas', eid]);
  }

  getCoordinador(p: ProyectoPublico): string {
    const coord = p.coordinadores?.[0]?.profesor;
    if (coord) return `${coord.nombres} ${coord.apellidos}`;
    return this.translate.instant('home.unknownLeader');
  }

  autorNombre(rol: string | null, nombres: string, apellidos: string): string {
    const rolLabel = rol
      ? this.translate.instant(`home.authorRoles.${rol}`)
      : this.translate.instant('home.authorRoles.colaborador');
    return `${nombres} ${apellidos} (${rolLabel})`;
  }
}
