import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PublicPortalService } from '../public-portal.service';
import { CardTiltDirective } from '../directives/card-tilt.directive';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import {
  resolveEscuelaCardConfig,
  urlsImagenesProyecto,
  type Escuela,
  type ProyectoPublico,
} from '../../../core/models/portal.model';

@Component({
  selector: 'app-portal-escuela-proyectos',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CardTiltDirective, ProjectImageCarouselComponent],
  templateUrl: './portal-escuela-proyectos.component.html',
  styleUrl: './portal-escuela-proyectos.component.scss',
  host: {
    class: 'portal-route-page',
    '[class.portal-route-page--entered]': 'entered()',
    '[class.portal-route-page--exiting]': 'exiting()',
  },
})
export class PortalEscuelaProyectosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PublicPortalService);
  private translate = inject(TranslateService);

  readonly escuela = signal<Escuela | null>(null);
  readonly themeKey = signal<string>('software');
  readonly proyectos = signal<ProyectoPublico[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly flippingProjectId = signal<number | null>(null);
  readonly entered = signal(false);
  readonly exiting = signal(false);

  ngOnInit(): void {
    window.setTimeout(() => this.entered.set(true), 120);

    const idEscuela = Number(this.route.snapshot.paramMap.get('idEscuela'));
    this.portal.listarEscuelas().subscribe({
      next: (escuelas) => {
        const found = escuelas.find((e) => e.id_escuela === idEscuela);
        if (!found) {
          this.router.navigate(['/']);
          return;
        }
        this.escuela.set(found);
        const config = resolveEscuelaCardConfig(found.nombre_escuela);
        if (config) this.themeKey.set(config.themeKey);
      },
    });

    this.portal.listarProyectos(idEscuela).subscribe({
      next: (data) => {
        this.proyectos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onProjectClick(proyecto: ProyectoPublico): void {
    if (this.flippingProjectId()) return;
    this.flippingProjectId.set(proyecto.id_proyecto);
    window.setTimeout(() => {
      this.router.navigate(['/proyectos', proyecto.id_proyecto]);
    }, 750);
  }

  goBack(): void {
    if (this.exiting()) return;
    this.exiting.set(true);
    window.setTimeout(() => this.router.navigate(['/']), 620);
  }

  imagenesProyecto(proyecto: ProyectoPublico): string[] {
    return urlsImagenesProyecto(proyecto);
  }

  getResumen(descripcion: string): string {
    return descripcion.length > 140 ? `${descripcion.slice(0, 140)}…` : descripcion;
  }

  getCoordinador(proyecto: ProyectoPublico): string {
    const coord = proyecto.coordinadores?.[0]?.profesor;
    if (coord) return `${coord.nombres} ${coord.apellidos}`;
    return this.translate.instant('home.unknownLeader');
  }

  getOrigen(proyecto: ProyectoPublico): string {
    if (proyecto.semillero) {
      return this.translate.instant('home.projectOrigin.semillero', {
        nombre: proyecto.semillero.nombre_semillero,
      });
    }
    return this.translate.instant('home.projectOrigin.curso', {
      curso: proyecto.curso?.nombre_curso ?? '',
    });
  }

  trackByProyectoId(_: number, item: ProyectoPublico): number {
    return item.id_proyecto;
  }
}
