import { Component, computed, inject, input } from '@angular/core';
import { alcanceEvento } from '../../../core/utils/evento-alcance.util';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Evento } from '../../../core/models/evento.model';
import { formatearRangoFechas, momentoEvento } from '../../../core/utils/date.util';
import { EventoMediaComponent } from '../evento-media/evento-media.component';

/**
 * Tarjeta de evento (lista de eventos e inicio del portal).
 * Imagen → fecha y momento → título → descripción → datos. El enlace del título cubre la tarjeta.
 */
@Component({
  selector: 'app-evento-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, EventoMediaComponent],
  templateUrl: './evento-card.component.html',
  styleUrl: './evento-card.component.scss',
})
export class EventoCardComponent {
  private translate = inject(TranslateService);

  readonly evento = input.required<Evento>();
  /** Ruta base del detalle: `/eventos` en el portal, `/admin/eventos` en el panel, etc. */
  readonly basePath = input('/eventos');

  readonly momento = computed(() => momentoEvento(this.evento().fecha_inicio, this.evento().fecha_fin));

  readonly alcance = computed(() => alcanceEvento(this.evento()));

  readonly fechas = computed(() =>
    formatearRangoFechas(this.evento().fecha_inicio, this.evento().fecha_fin, this.translate.getCurrentLang() ?? 'es'),
  );
}
