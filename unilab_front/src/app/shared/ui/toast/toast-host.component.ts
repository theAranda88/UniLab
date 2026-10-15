import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from './toast.service';

/** Contenedor de toasts; se monta una sola vez en el componente raíz. */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div class="toast toast--{{ toast.type }}" role="status" aria-live="polite">
        <i
          class="ti"
          [class.ti-circle-check]="toast.type === 'success'"
          [class.ti-alert-circle]="toast.type === 'error'"
          [class.ti-info-circle]="toast.type === 'info'"
          aria-hidden="true"
        ></i>
        <span>{{ toast.messageKey | translate }}</span>
        <button type="button" (click)="toastService.dismiss(toast.id)" [attr.aria-label]="'common.close' | translate">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </div>
    }
  `,
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
}
