import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { partesFecha } from '../../../core/utils/date.util';

/**
 * Imagen de un evento: el flyer si existe y carga; si no, una composición institucional
 * con la fecha del evento. Al fallar la carga se deja de renderizar el <img>, así que
 * nunca entra en un bucle de reintentos.
 */
@Component({
  selector: 'app-evento-media',
  standalone: true,
  template: `
    @if (url() && !roto()) {
      <img
        class="media__img"
        [src]="url()"
        [alt]="alt()"
        [attr.loading]="prioridad() ? null : 'lazy'"
        (error)="roto.set(true)"
      />
    } @else {
      <div class="media__fallback" role="img" [attr.aria-label]="alt()">
        <span class="media__ring media__ring--a" aria-hidden="true"></span>
        <span class="media__ring media__ring--b" aria-hidden="true"></span>
        <span class="media__dot" aria-hidden="true"></span>
        @if (fecha(); as f) {
          <span class="media__date" aria-hidden="true">
            <strong>{{ f.dia }}</strong>
            <span>{{ f.mes }} {{ f.anio }}</span>
          </span>
        } @else {
          <i class="ti ti-calendar-event media__icon" aria-hidden="true"></i>
        }
      </div>
    }
  `,
  styleUrl: './evento-media.component.scss',
  host: { '[class.media--hero]': 'variante() === "hero"' },
})
export class EventoMediaComponent {
  private translate = inject(TranslateService);

  readonly url = input<string | null | undefined>(null);
  readonly alt = input('');
  readonly fechaInicio = input<string | null | undefined>(null);
  readonly variante = input<'card' | 'hero'>('card');
  /** Imagen visible al cargar la página (hero): sin carga diferida. */
  readonly prioridad = input(false);

  readonly roto = signal(false);

  private readonly idioma = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.getCurrentLang() ?? 'es'),
    ),
    { initialValue: 'es' },
  );

  readonly fecha = computed(() => {
    const iso = this.fechaInicio();
    return iso ? partesFecha(iso, this.idioma() ?? 'es') : null;
  });
}
