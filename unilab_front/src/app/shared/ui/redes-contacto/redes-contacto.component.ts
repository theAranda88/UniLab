import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { RedesContacto } from '../../../core/models/usuario.model';

interface EnlaceRed {
  clave: keyof RedesContacto;
  url: string;
  icono: string;
}

const ICONOS: Record<keyof RedesContacto, string> = {
  linkedin: 'ti-brand-linkedin',
  github: 'ti-brand-github',
  portafolio: 'ti-world',
};

/** Íconos enlazados a las redes de contacto de un usuario (LinkedIn, GitHub, portafolio). */
@Component({
  selector: 'app-redes-contacto',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (enlaces().length) {
      <span class="redes">
        @for (red of enlaces(); track red.clave) {
          <a
            class="edu-icon-btn redes__link"
            [class.redes__link--sm]="compacto()"
            [href]="red.url"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="'perfil.redes.' + red.clave | translate"
            [attr.title]="'perfil.redes.' + red.clave | translate"
          >
            <i class="ti" [class]="red.icono" aria-hidden="true"></i>
          </a>
        }
      </span>
    } @else if (mostrarVacio()) {
      <span class="redes__vacio">{{ 'perfil.redes.sinRedes' | translate }}</span>
    }
  `,
  styles: [
    `
      .redes {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 2px;
      }
      .redes__link--sm {
        width: 30px;
        height: 30px;
        font-size: 16px;
      }
      .redes__vacio {
        font-size: 13px;
        color: rgba(30, 30, 30, 0.55);
      }
    `,
  ],
})
export class RedesContactoComponent {
  readonly redes = input<RedesContacto | null | undefined>(null);
  readonly compacto = input(false);
  readonly mostrarVacio = input(false);

  readonly enlaces = computed<EnlaceRed[]>(() => {
    const redes = this.redes();
    if (!redes) return [];
    return (Object.keys(ICONOS) as (keyof RedesContacto)[])
      .filter((clave) => esUrlSegura(redes[clave]))
      .map((clave) => ({ clave, url: redes[clave]!, icono: ICONOS[clave] }));
  });
}

/** Solo enlaces http(s): el backend ya lo valida, pero evita `javascript:` si llegara otro dato. */
function esUrlSegura(url: string | null | undefined): boolean {
  return !!url && /^https?:\/\//i.test(url);
}
