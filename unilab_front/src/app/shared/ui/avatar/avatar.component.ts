import { Component, input, signal } from '@angular/core';

/**
 * Contenido de un avatar: la foto de perfil o, si no hay o no carga, las iniciales.
 * El contenedor (círculo, tamaño, borde) lo pone quien lo usa; debe tener `overflow: hidden`.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (url() && url() !== urlFallida()) {
      <img class="avatar__img" [src]="url()" [alt]="alt()" (error)="urlFallida.set(url() ?? null)" />
    } @else {
      {{ iniciales() }}
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .avatar__img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
    }
  `,
})
export class AvatarComponent {
  readonly url = input<string | null | undefined>(null);
  readonly iniciales = input('?');
  /** Texto alternativo; vacío cuando el nombre ya aparece al lado. */
  readonly alt = input('');

  /** URL que no cargó; si cambia la foto se vuelve a intentar. */
  readonly urlFallida = signal<string | null>(null);
}
