import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { urlImagenDestacadaSemillero, type SemilleroPublico } from '../../../core/models/portal.model';
import { estiloDeEscuela } from '../../../core/utils/portal-theme.util';

/**
 * Tarjeta pública de semillero: imagen (o fondo con el color de la escuela),
 * escuela, descripción breve, proyectos publicados, integrantes y líder.
 */
@Component({
  selector: 'app-semillero-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './semillero-card.component.html',
  styleUrl: './semillero-card.component.scss',
})
export class SemilleroCardComponent {
  readonly semillero = input.required<SemilleroPublico>();
  /** Oculta la escuela cuando la tarjeta ya está dentro de la página de esa escuela. */
  readonly mostrarEscuela = input(true);

  readonly estilo = computed(() => estiloDeEscuela(this.semillero().escuela));
  readonly imagen = computed(() => urlImagenDestacadaSemillero(this.semillero()));
  readonly totalProyectos = computed(() => this.semillero().total_proyectos_publicados ?? 0);

  readonly lider = computed(() => {
    const l = this.semillero().lider;
    return `${l?.nombres ?? ''} ${l?.apellidos ?? ''}`.trim();
  });

  readonly inicialesLider = computed(() => {
    const l = this.semillero().lider;
    return `${l?.nombres?.charAt(0) ?? ''}${l?.apellidos?.charAt(0) ?? ''}`.toUpperCase() || '?';
  });
}
