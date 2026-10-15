import { Component, Input } from '@angular/core';

/**
 * C24 · Estado vacío o de error: ícono, título, explicación y (opcional) acción proyectada.
 * Uso: <app-empty-state icon="ti-folders" [title]="..." [message]="...">acción</app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <span class="empty__icon" aria-hidden="true"><i class="ti {{ icon }}"></i></span>
    @if (title) {
      <p class="empty__title">{{ title }}</p>
    }
    @if (message) {
      <p class="empty__message">{{ message }}</p>
    }
    <div class="empty__actions"><ng-content /></div>
  `,
  styleUrl: './empty-state.component.scss',
  host: {
    '[class.empty--error]': "tone === 'error'",
    '[class.empty--compact]': 'compact',
    role: 'status',
  },
})
export class EmptyStateComponent {
  @Input() icon = 'ti-inbox';
  @Input() title = '';
  @Input() message = '';
  /** `error` pinta el ícono en rojo (sección que no pudo cargar). */
  @Input() tone: 'default' | 'error' = 'default';
  /** Versión reducida para dentro de cards. */
  @Input() compact = false;
}
