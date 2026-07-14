import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PublicPortalService } from '../public-portal.service';
import { AuthModalService } from '../auth-modal.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import { urlsImagenesProyecto, type ProyectoPublico } from '../../../core/models/portal.model';

@Component({
  selector: 'app-portal-proyecto-detalle',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ProjectImageCarouselComponent],
  templateUrl: './portal-proyecto-detalle.component.html',
  styleUrl: './portal-proyecto-detalle.component.scss',
  host: {
    class: 'portal-route-page',
    '[class.portal-route-page--entered]': 'entered()',
    '[class.portal-route-page--exiting]': 'exiting()',
  },
})
export class PortalProyectoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);
  private translate = inject(TranslateService);
  readonly authModal = inject(AuthModalService);
  private auth = inject(AuthService);

  readonly proyecto = signal<ProyectoPublico | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly entered = signal(false);
  readonly exiting = signal(false);
  readonly logoError = signal(false);

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly escuelaId = computed(() => this.proyecto()?.curso?.id_escuela ?? null);
  readonly imagenes = computed(() => {
    const p = this.proyecto();
    return p ? urlsImagenesProyecto(p) : [];
  });

  ngOnInit(): void {
    window.setTimeout(() => this.entered.set(true), 120);
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
    this.authModal.open(() => window.open(url, '_blank', 'noopener,noreferrer'));
  }

  onRequireAuth(): void {
    if (!this.isLoggedIn()) this.authModal.open();
  }

  goBack(): void {
    const eid = this.escuelaId();
    if (!eid || this.exiting()) return;
    this.exiting.set(true);
    window.setTimeout(() => this.router.navigate(['/escuelas', eid]), 620);
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
