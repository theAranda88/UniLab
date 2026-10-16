import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectImageCarouselComponent } from '../project-image-carousel/project-image-carousel.component';
import { urlsImagenesProyecto, type ProyectoPublico } from '../../../core/models/portal.model';

const ICONOS_TIPO: Record<string, string> = {
  web: 'ti-world-www',
  movil: 'ti-device-mobile',
  podcast: 'ti-microphone',
  otro: 'ti-flask',
};

/**
 * Tarjeta de proyecto publicado (inicio y página de escuela).
 * El título es el enlace y cubre toda la tarjeta; los controles del carrusel quedan por
 * encima, así no hay elementos interactivos anidados.
 */
@Component({
  selector: 'app-proyecto-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, ProjectImageCarouselComponent],
  templateUrl: './proyecto-card.component.html',
  styleUrl: './proyecto-card.component.scss',
})
export class ProyectoCardComponent {
  private translate = inject(TranslateService);

  readonly proyecto = input.required<ProyectoPublico>();
  /** En el inicio se muestra a qué escuela pertenece; en la página de la escuela, no. */
  readonly mostrarEscuela = input(false);
  /** Carrusel con todas las imágenes o solo la portada. */
  readonly carrusel = input(true);

  readonly imagenes = computed(() => {
    const urls = urlsImagenesProyecto(this.proyecto());
    return this.carrusel() ? urls : urls.slice(0, 1);
  });

  readonly icono = computed(() => ICONOS_TIPO[this.proyecto().tipo_proyecto] ?? 'ti-flask');

  readonly director = computed(() => {
    const coord = this.proyecto().coordinadores?.[0]?.profesor;
    return coord ? `${coord.nombres} ${coord.apellidos}` : null;
  });

  readonly origen = computed(() => {
    const p = this.proyecto();
    if (p.semillero) {
      return this.translate.instant('home.projectOrigin.semillero', { nombre: p.semillero.nombre_semillero });
    }
    return p.curso?.nombre_curso
      ? this.translate.instant('home.projectOrigin.curso', { curso: p.curso.nombre_curso })
      : null;
  });
}
